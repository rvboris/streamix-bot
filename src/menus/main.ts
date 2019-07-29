import TelegrafInlineMenu from 'telegraf-inline-menu';
import settingsMenu from './settings';
import botsMenu from './bots';
import sourcesMenu from './sources';
import adminMenu from './admin';
import getTelegram from '../util/getTelegram';
import { Bot, Channel } from '../entites';
import { ContextMessageUpdate } from 'telegraf';
import { UserStatus } from '../entites/User';
import { ActionCode } from './ActionCode';

const telegramInstance = getTelegram();

export default (ctx: ContextMessageUpdate): TelegrafInlineMenu => {
  const mainMenuTitle = (ctx: ContextMessageUpdate): string => {
    if (ctx.user.status === UserStatus.STARTED) {
      return 'Choose language / Выберите язык';
    }

    return ctx.i18n.t('menus.main.title');
  };

  const menu = new TelegrafInlineMenu(mainMenuTitle);

  menu.select(ActionCode.MAIN_LANGUAGE, ['ru', 'en'], {
    setFunc: async (ctx, key): Promise<void> => {
      ctx.user.settings.language = key;
      ctx.user.status = UserStatus.INITED;

      await ctx.connection.manager.save(ctx.user);

      ctx.i18n.locale(key);

      await ctx.answerCbQuery(ctx.i18n.t('menus.settings.changeLanguageText'));
    },
    isSetFunc: (ctx, key): boolean => key === ctx.user.settings.language,
    hide: (ctx: ContextMessageUpdate): boolean => ctx.user.status !== UserStatus.STARTED,
  });

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.settingsBtn'), ActionCode.MAIN_SETTINGS, settingsMenu(), {
    hide: (ctx): boolean => ctx.user.status === UserStatus.STARTED,
  });

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.botsBtn'), ActionCode.MAIN_BOTS, botsMenu(ctx), {
    hide: (ctx): boolean => ctx.user.status === UserStatus.STARTED,
  });

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.sourcesBtn'), ActionCode.MAIN_SOURCES, sourcesMenu(ctx), {
    hide: async (ctx): Promise<boolean> => {
      const isAnyChannels = await ctx.connection.manager.count(Channel, { user: ctx.user });

      return ctx.user.status === UserStatus.STARTED || !isAnyChannels;
    },
  });

  menu.submenu((ctx): string => ctx.i18n.t('menus.main.adminBtn'), ActionCode.MAIN_ADMIN, adminMenu(), {
    hide: async (ctx): Promise<boolean> => !ctx.user.isAdmin,
  });

  menu.simpleButton((ctx): string => ctx.i18n.t('menus.main.howToAddChannelBtn'), ActionCode.MAIN_ADD_CHANNEL, {
    doFunc: async (ctx): Promise<void> => {
      await ctx.reply(ctx.i18n.t('menus.main.howToAddChannelText'));
    },
    hide: async (ctx): Promise<boolean> => {
      const isAnyBots = await ctx.connection.manager.count(Bot, { user: ctx.user });

      return ctx.user.status === UserStatus.STARTED || !isAnyBots;
    },
  });

  menu.simpleButton((ctx): string => ctx.i18n.t('menus.main.helpBtn'), ActionCode.MAIN_HELP, {
    doFunc: async (ctx): Promise<void> => {
      await ctx.reply(ctx.i18n.t('menus.main.helpText'), {
        disable_web_page_preview: true,
      } as any);
    },
    hide: (ctx): boolean => ctx.user.status === UserStatus.STARTED,
  });

  menu.question((ctx): string => ctx.i18n.t('menus.main.contactBtn'), ActionCode.MAIN_CONTACT, {
    questionText: ctx.i18n.t('menus.main.contactQuestion'),
    setFunc: async (ctx, answer): Promise<void> => {
      if (!answer) {
        await ctx.reply(ctx.i18n.t('menus.main.contactFailText'));
        return;
      }

      let msg = 'From:\n```\n';

      Object.entries(ctx.from).forEach(([key, value]): void => {
        msg += `${key}: ${value}\n`;
      });

      msg += `\`\`\`\nMessage: ${answer}`;

      await telegramInstance.sendMessage(process.env.ADMIN_ID, msg, { parse_mode: 'Markdown' });
      await ctx.reply(ctx.i18n.t('menus.main.contactSuccessText'));
    },
    hide: (ctx): boolean => ctx.user.status === UserStatus.STARTED,
  });

  menu.setCommand('start');

  return menu;
};
