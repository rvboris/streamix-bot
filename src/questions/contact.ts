import getTelegram from '../util/getTelegram';
import TelegrafStatelessQuestion from 'telegraf-stateless-question';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { QuestionCode } from '../enums/QuestionCode';

const bot = getTelegram();

export const contactQuestion = new TelegrafStatelessQuestion<ExtendedTelegrafContext>(
  QuestionCode.CONTACT,
  async (ctx) => {
    const { message } = ctx;
    const { text } = message;

    if (!text) {
      await ctx.reply(ctx.i18n.t('menus.main.contactFailText'));
      return;
    }

    let msg = 'From:\n```\n';

    Object.entries(ctx.from).forEach(([key, value]): void => {
      msg += `${key}: ${value}\n`;
    });

    msg += `\`\`\`\nMessage: ${text}`;

    await bot.sendMessage(process.env.ADMIN_ID, msg, {
      parse_mode: 'Markdown',
    });

    await ctx.reply(ctx.i18n.t('menus.main.contactSuccessText'));
  },
);
