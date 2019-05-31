import { Telegram } from 'telegraf';

export default (telegramToken = process.env.TELEGRAM_TOKEN): Telegram => new Telegram(telegramToken, {});
