import { Context, Markup } from 'telegraf';

import {updateState} from "../services";

// Ввод названия группы
export const createGroup = (ctx: Context): void => {
  const userId = ctx.from?.id;
  if (!userId) {
    ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  ctx.reply('Введите название вашей группы 🎅', Markup.keyboard([
    ['Отменить']
  ]).resize());

  updateState(userId, {
    currentStep: 'promptParticipants',
    newSantaName: '',
    participantsCount: 0,
    participants: [],
  })
};
