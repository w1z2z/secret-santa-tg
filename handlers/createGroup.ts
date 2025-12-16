import { Context } from 'telegraf';

import {updateState} from "../services";
import {getHomeButton} from "../utils";

// Ввод названия группы
export const createGroup = async (ctx: Context): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const sentMessage = await ctx.reply('Введите название вашей группы 🎅', getHomeButton());

  updateState(userId, {
    currentStep: 'promptParticipants',
    newSantaName: '',
    participantsCount: 0,
    participants: [],
    lastBotMessageId: sentMessage.message_id
  })
};
