import {Context} from "telegraf";

import { updateState} from "../services";

export const promptParticipants = async (ctx: any): Promise<void> => {
  await ctx.reply('Введите имена участников по очереди отдельными сообщениями (минимум 3 человека):');
  updateState({ currentStep: 'addParticipants', newSantaName: ctx.message.text })
}
