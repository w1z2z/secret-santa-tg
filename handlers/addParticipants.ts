import {Markup} from "telegraf";
import {getState, updateState} from "../services";

export const addParticipants = async (ctx: any): Promise<void> => {
  const currentState = getState();
  const updatedParticipants = [...currentState.participants, ctx.message?.text];

  if (updatedParticipants.length >= 3) {
    await ctx.reply(`Введенные участники: ${updatedParticipants.join(', ')}`, Markup.inlineKeyboard([
      Markup.button.callback('Завершить ввод участников', 'finish_entering_participants'),
    ]));
  } else {
    await ctx.reply(`Введите имя следующего участника:`);
  }

  updateState({ participants: updatedParticipants, participantsCount: updatedParticipants.length });
}
