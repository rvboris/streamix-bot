import TelegrafI18n from 'telegraf-i18n';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { Middleware } from 'telegraf';

export const i18n = ({
  directory,
  defaultLanguage,
}: {
  directory: string;
  defaultLanguage: string;
}): Middleware<ExtendedTelegrafContext> => (ctx: ExtendedTelegrafContext, next: () => void): void => {
  const i18n = new TelegrafI18n({
    defaultLanguage,
    directory,
    useSession: false,
    allowMissing: false,
  });

  i18n.middleware()(ctx, next as any);
};
