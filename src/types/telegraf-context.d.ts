import { I18n } from 'telegraf-i18n';
import { Connection } from 'typeorm';
import { User } from '../entites';

declare module 'telegraf' {
  interface ContextMessageUpdate {
    i18n: I18n;
    connection?: Connection;
    user?: User;
    match?: string[];
  }
}
