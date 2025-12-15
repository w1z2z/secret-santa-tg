import {Context} from "telegraf";
import {clearState} from "../services";
import {getMainMenuKeyboard} from "../utils";

export const home = async (ctx: Context): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  clearState(userId);
  
  await ctx.reply(
    '🏠 Главное меню\n\nВыберите действие:',
    getMainMenuKeyboard()
  );
};

