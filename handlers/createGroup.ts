import { Context } from 'telegraf';

import {updateState} from "../services";

// Ввод названия группы
export const createGroup = (ctx: Context): void => {
  ctx.reply('Введите название вашей группы 🎅');

  updateState({
    currentStep: 'promptParticipants',
    newSantaName: '',
    participantsCount: 0,
    participants: [],
  })
};

