import { channelMenu } from './channel';
import { ActionCode } from '../enums/action-code';
import { Channel } from '../entites';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { MenuTemplate, createBackMainMenuButtons } from 'telegraf-inline-menu';

export const channelsMenu = (): MenuTemplate<ExtendedTelegrafContext> => {
  const menu = new MenuTemplate<ExtendedTelegrafContext>((ctx): string => ctx.i18n.t('menus.channels.title'));

  const getChannelsNames = async (ctx: ExtendedTelegrafContext): Promise<string[]> => {
    if (!ctx.match) {
      return [];
    }

    const [, botId = ''] = ctx.match;

    const channels = await ctx.connection
      .createQueryBuilder(Channel, 'channel')
      .leftJoinAndSelect('channel.bots', 'bot')
      .where('bot.id = ANY(:botId)', { botId: [parseInt(botId, 10)] })
      .getMany();

    return channels.map((channel): string => `${channel.id}`);
  };

  menu.chooseIntoSubmenu(ActionCode.CHANNELS_SELECT, getChannelsNames, channelMenu(), {
    buttonText: async (ctx, key): Promise<string> => {
      const { name } = await ctx.connection.manager.findOne(Channel, {
        id: parseInt(key, 10),
      });
      return name;
    },
    columns: 1,
  });

  menu.manualRow(
    createBackMainMenuButtons<ExtendedTelegrafContext>(
      (ctx) => ctx.i18n.t('shared.backBtn'),
      (ctx) => ctx.i18n.t('shared.backToMainBtn'),
    ),
  );

  return menu;
};
