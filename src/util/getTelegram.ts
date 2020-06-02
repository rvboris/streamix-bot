import { Telegram } from 'telegraf';
import { HttpsProxyAgent } from 'https-proxy-agent';

export const getTelegram = (telegramToken = process.env.TELEGRAM_TOKEN): Telegram =>
  new Telegram(telegramToken, {
    agent: process.env.HTTPS_PROXY ? new HttpsProxyAgent(process.env.HTTPS_PROXY) : undefined,
  });
