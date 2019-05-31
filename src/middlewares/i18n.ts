import { ContextMessageUpdate, Middleware } from 'telegraf';
import TelegrafI18n from 'telegraf-i18n';

export const i18n = ({
  directory,
  defaultLanguage,
}: {
  directory: string;
  defaultLanguage: string;
}): Middleware<ContextMessageUpdate> => (ctx: ContextMessageUpdate, next: Function): void => {
  const i18n = new TelegrafI18n({
    defaultLanguage,
    directory,
    useSession: false,
    allowMissing: false,
  });

  i18n.middleware()(ctx, next as any);
};
