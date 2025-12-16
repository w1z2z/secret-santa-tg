import {Context} from "telegraf";
import {clearState} from "../services";
import {getMainMenuKeyboard, logger} from "../utils";

export const home = async (ctx: Context): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.error('HOME', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  logger.info('HOME', `Пользователь ${userId} вернулся в главное меню`);
  clearState(userId);
  
  await ctx.reply(
    '🏠 Главное меню\n\nВыберите действие:',
    getMainMenuKeyboard()
  );
};

