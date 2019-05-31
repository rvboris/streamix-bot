import TelegrafInlineMenu from 'telegraf-inline-menu';
import { ActionCode } from './ActionCode';
import { Channel } from '../entites';
import { ContextMessageUpdate } from 'telegraf';
import channelMenu from './channel';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.channels.title'));

  const getChannelsNames = async (ctx: ContextMessageUpdate): Promise<string[]> => {
    if (!ctx.match) {
      return [];
    }

    const [, botId = ''] = ctx.match;

    const channels = await ctx.connection
      .createQueryBuilder(Channel, 'channel')
      .leftJoinAndSelect('channel.bot', 'bot')
      .where('bot.id = :botId', { botId })
      .getMany();

    return channels.map((channel): string => channel.id.toString());
  };

  menu.selectSubmenu(ActionCode.CHANNELS_SELECT, getChannelsNames, channelMenu(), {
    textFunc: async (ctx, key): Promise<string> => {
      const { title } = await ctx.connection.manager.findOne(Channel, { id: parseInt(key, 10) });
      return title;
    },
    columns: 1,
  });

  return menu;
};
