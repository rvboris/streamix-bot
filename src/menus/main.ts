import { ActionCode } from '../enums/action-code';
import { adminMenu } from './admin';
import { Bot, Channel } from '../entites';
import { botsMenu } from './bots';
import { contactQuestion } from '../questions/contact';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { helpMenu } from './help';
import { MenuMiddleware } from 'telegraf-inline-menu';
import { MenuTemplate } from 'telegraf-inline-menu';
import { settingsMenu } from './settings';
import { sourcesMenu } from './sources';
import { UserStatus } from '../entites/user';

export const mainMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const mainMenuTitle = (ctx): string => {
    if (ctx.user.status === UserStatus.STARTED) {
      return 'Choose language / Выберите язык';
    }

    return ctx.i18n.t('menus.main.title');
  };

  const menu = new MenuTemplate<ExtendedTelegrafContext>(mainMenuTitle);

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.adminBtn'), ActionCode.MAIN_ADMIN, adminMenu(), {
    hide: async (ctx): Promise<boolean> => !ctx.user.isAdmin,
  });

  menu.select(ActionCode.MAIN_LANGUAGE, ['ru', 'en'], {
    set: async (ctx, key): Promise<void> => {
      ctx.user.settings.language = key;
      ctx.user.status = UserStatus.INITED;

      await ctx.connection.manager.save(ctx.user);

      ctx.i18n.locale(key);

      await ctx.answerCbQuery(ctx.i18n.t('menus.settings.changeLanguageText'));
    },
    isSet: (ctx, key): boolean => key === ctx.user.settings.language,
    hide: (ctx): boolean => ctx.user.status !== UserStatus.STARTED,
  });

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.settingsBtn'), ActionCode.MAIN_SETTINGS, settingsMenu(), {
    hide: (ctx): boolean => ctx.user.status === UserStatus.STARTED,
  });

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.botsBtn'), ActionCode.MAIN_BOTS, botsMenu(), {
    hide: async (ctx): Promise<boolean> => {
      const isAnyBots = await ctx.connection.manager.count(Bot, {
        user: ctx.user,
      });

      return !isAnyBots || ctx.user.status === UserStatus.STARTED;
    },
  });

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.sourcesBtn'), ActionCode.MAIN_SOURCES, sourcesMenu(), {
    hide: async (ctx): Promise<boolean> => {
      const isAnyChannels = await ctx.connection.manager.count(Channel, {
        user: ctx.user,
      });

      return ctx.user.status === UserStatus.STARTED || !isAnyChannels;
    },
  });

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.helpBtn'), ActionCode.MAIN_HELP, helpMenu());

  menu.interact((ctx): string => ctx.i18n.t('menus.main.contactBtn'), ActionCode.MAIN_CONTACT, {
    do: async (ctx): Promise<void> => {
      await contactQuestion.replyWithMarkdown(ctx, ctx.i18n.t('menus.main.contactQuestion'));
    },
  });

  return menu;
};

export const mainMenuMiddleware = new MenuMiddleware('/', mainMenu());
