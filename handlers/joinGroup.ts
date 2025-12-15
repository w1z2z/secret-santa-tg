import { Context } from 'telegraf';
import {updateState} from "../services";

export const join = (ctx: Context): void => {
  const userId = ctx.from?.id;
  if (!userId) {
    ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  ctx.reply('Для присоединения к группе введите секретный код "Дед-Мороза" 🎅');
  updateState(userId, { currentStep: 'joinExistingGroup' })
};
