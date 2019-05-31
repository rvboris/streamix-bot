import { ContextMessageUpdate, Middleware } from 'telegraf';
import { User, Settings } from '../entites';
import { UserStatus } from '../entites/User';

export const userInfo = ({ defaultLanguage }: { defaultLanguage: string }): Middleware<ContextMessageUpdate> => async (
  ctx: ContextMessageUpdate,
  next: Function,
): Promise<void> => {
  const userRepository = ctx.connection.getRepository(User);
  const telegramId = ctx.from.id.toString();
  const user = await userRepository.findOne({ telegramId });

  if (user) {
    ctx.i18n.locale(user.settings.language);
    ctx.user = user;
  } else {
    const settings = new Settings();
    settings.language = defaultLanguage;

    await ctx.connection.manager.save(settings);

    const user = new User();

    user.telegramId = telegramId;
    user.settings = settings;
    user.username = ctx.from.username;
    user.status = UserStatus.STARTED;

    await ctx.connection.manager.save(user);

    ctx.user = user;
  }

  next && next(ctx);
};
