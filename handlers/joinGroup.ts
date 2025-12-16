import { Context } from 'telegraf';
import {updateState} from "../services";
import {getHomeButton, logger, getUserIdentifier} from "../utils";

export const join = (ctx: Context): void => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.error('JOIN_GROUP', 'userId не определен');
    ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const userIdentifier = getUserIdentifier(ctx.from);
  logger.info('JOIN_GROUP', `Пользователь ${userIdentifier} начал процесс присоединения к группе`);
  ctx.reply('Для присоединения к группе введите секретный код "Дед-Мороза" 🎅', getHomeButton());
  updateState(userId, { currentStep: 'joinExistingGroup' })
};
