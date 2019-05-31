import { ContextMessageUpdate, Middleware } from 'telegraf';
import MainMenu from '../menus/main';

export const navigation = (): Middleware<ContextMessageUpdate> => (ctx: ContextMessageUpdate, next: Function): void => {
  MainMenu(ctx).init({
    backButtonText: ctx.i18n.t('shared.backBtn'),
    mainMenuButtonText: ctx.i18n.t('shared.backToMainBtn'),
  })(ctx, next);
};
