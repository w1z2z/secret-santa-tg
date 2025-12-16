import {Context} from "telegraf";

import { updateState, getState} from "../services";
import {getHomeButton} from "../utils";

export const promptParticipants = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const state = getState(userId);

  // Удаляем предыдущее сообщение бота
  try {
    if (state.lastBotMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, state.lastBotMessageId);
    }
  } catch (e) {
    // Игнорируем ошибку
  }

  // Удаляем сообщение пользователя с названием группы
  try {
    if (ctx.message?.message_id && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
  } catch (e) {
    // Игнорируем ошибку
  }

  // Удаляем предыдущее сообщение с меню (если есть)
  try {
    if (state.lastMenuMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, state.lastMenuMessageId);
    }
  } catch (e) {
    // Игнорируем ошибку
  }

  const sentMessage = await ctx.reply('Введите имена участников по очереди отдельными сообщениями (минимум 3 человека):', getHomeButton());
  updateState(userId, { 
    currentStep: 'addParticipants', 
    newSantaName: ctx.message.text,
    lastBotMessageId: sentMessage.message_id
  })
}
