import { Middleware } from 'telegraf';
import { ExtendedTelegrafContext } from '../types/extended-telegraf-context';
import { User, Settings } from '../entites';
import { UserStatus } from '../entites/User';

export const userInfo = ({
  defaultLanguage,
}: {
  defaultLanguage: string;
}): Middleware<ExtendedTelegrafContext> => async (ctx: ExtendedTelegrafContext, next: () => void): Promise<void> => {
  const userRepository = ctx.connection.getRepository(User);
  const telegramId = `${ctx.from.id}`;
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

  next && next();
};
