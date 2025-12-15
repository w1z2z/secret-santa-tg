import {Context} from "telegraf";

import { updateState} from "../services";
import {getHomeButton} from "../utils";

export const promptParticipants = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  await ctx.reply('Введите имена участников по очереди отдельными сообщениями (минимум 3 человека):', getHomeButton());
  updateState(userId, { currentStep: 'addParticipants', newSantaName: ctx.message.text })
}
