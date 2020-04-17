import TelegrafInlineMenu from 'telegraf-inline-menu';
import { ActionCode } from './ActionCode';
import { Channel, Settings } from '../entites';
import logger from '../util/logger';

export default (): TelegrafInlineMenu => {
  const menu = new TelegrafInlineMenu((ctx): string => ctx.i18n.t('menus.channel.title'));

  menu.button((ctx): string => ctx.i18n.t('menus.channel.deleteBtn'), ActionCode.CHANNEL_DELETE, {
    doFunc: async (ctx): Promise<void> => {
      try {
        const [, , channelId = ''] = ctx.match;

        ctx.connection.manager.transaction(
          async (transactionalEntityManager): Promise<void> => {
            if (ctx.user.settings.defaultChannel.id.toString() === channelId) {
              await transactionalEntityManager.update(Settings, { user: ctx.user }, { defaultChannel: null });
            }

            await transactionalEntityManager.delete(Channel, { id: channelId });

            const channels = await transactionalEntityManager.find(Channel, {
              user: ctx.user,
            });

            if (channels) {
              await transactionalEntityManager.update(Settings, { user: ctx.user }, { defaultChannel: channels[0] });
            }
          },
        );
      } catch (e) {
        logger.error(e.stack, { ctx });
        await ctx.reply(ctx.i18n.t('menus.channel.deleteFailText'));
        return;
      }

      await ctx.reply(ctx.i18n.t('menus.channel.deleteSuccessText'));
    },
    setParentMenuAfter: true,
  });

  return menu;
};
