import {Markup} from "telegraf";
import {getState, updateState} from "../services";

export const addParticipants = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const currentState = getState(userId);
  const newParticipant = ctx.message?.text?.trim();

  if (!newParticipant) {
    await ctx.reply('Пожалуйста, введите имя участника');
    return;
  }

  // Проверка на дубликаты
  if (currentState.participants.includes(newParticipant)) {
    await ctx.reply(`Участник "${newParticipant}" уже добавлен. Введите другое имя.`);
    return;
  }

  const updatedParticipants = [...currentState.participants, newParticipant];

  if (updatedParticipants.length >= 3) {
    await ctx.reply(`Введенные участники: ${updatedParticipants.join(', ')}`, Markup.inlineKeyboard([
      Markup.button.callback('Завершить ввод участников', 'finish_entering_participants'),
    ]));
  } else {
    await ctx.reply(`Введите имя следующего участника (добавлено: ${updatedParticipants.length}, минимум: 3):`, Markup.keyboard([
      ['Отменить']
    ]).resize());
  }

  updateState(userId, { participants: updatedParticipants, participantsCount: updatedParticipants.length });
}
