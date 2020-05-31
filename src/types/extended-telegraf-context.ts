import { I18n } from 'telegraf-i18n';
import { Connection } from 'typeorm';
import { User } from '../entites';
import { Context } from 'telegraf';

export interface ExtendedTelegrafContext extends Context {
  i18n: I18n;
  connection?: Connection;
  user?: User;
}
