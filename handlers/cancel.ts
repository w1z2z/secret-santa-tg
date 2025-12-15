import {Context, Markup} from "telegraf";
import {clearState, getState} from "../services";

export const cancel = async (ctx: Context): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const state = getState(userId);
  const isActiveProcess = state.currentStep !== 'newSanta';

  clearState(userId);
  
  if (isActiveProcess) {
    await ctx.reply(
      'Действие отменено ✅\n\nВыберите новое действие:',
      Markup.keyboard([
        ['Создать группу', 'Присоединиться к группе'],
        ['Инструкция к боту']
      ]).resize()
    );
  } else {
    await ctx.reply(
      'Нет активного процесса для отмены.\n\nВыберите действие:',
      Markup.keyboard([
        ['Создать группу', 'Присоединиться к группе'],
        ['Инструкция к боту']
      ]).resize()
    );
  }
};

