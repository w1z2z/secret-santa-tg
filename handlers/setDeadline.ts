import {Context} from "telegraf";
import {getHomeButton, getCurrentMonthCalendar} from "../utils";
import {updateState, getState} from "../services";

export const setDeadline = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  // Сохраняем выбранную цену подарка
  const selectedPrice = ctx.match[0];
  updateState(userId, { giftPrice: selectedPrice, currentStep: 'selectDeadline' });

  // Удаляем сообщение с выбором цены перед показом календаря
  try {
    await ctx.deleteMessage();
  } catch (e) {
    // Игнорируем ошибку, если сообщение уже удалено
  }

  await ctx.reply(
    '📅 Выберите дату в декабре, когда нужно подарить подарки (дедлайн)',
    getCurrentMonthCalendar()
  );
};

export const enterDeadline = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const deadlineText = ctx.message?.text?.trim();
  
  if (!deadlineText) {
    await ctx.reply('Пожалуйста, введите дату дедлайна', getHomeButton());
    return;
  }

  // Сохраняем дедлайн как текст
  const currentState = getState(userId);
  updateState(userId, { deadline: deadlineText, currentStep: 'saveGroup' });
  
  // Автоматически сохраняем группу после ввода дедлайна
  if (currentState.giftPrice) {
    // Имитируем callback для saveGroup
    const mockCtx = {
      ...ctx,
      match: [currentState.giftPrice]
    };
    const { saveGroup } = await import('./saveGroup');
    await saveGroup(mockCtx);
  }
};

