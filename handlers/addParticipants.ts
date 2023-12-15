import {Markup} from "telegraf";
import {updateState} from "../services";

let participants: string[] = [];

export const addParticipants = async (ctx: any): Promise<void> => {
  participants.push(ctx.message?.text)

  if (participants.length >= 3) {
    // Если достигнуто минимальное количество участников
    await ctx.reply(`Введенные участники: ${participants.join(', ')}`, Markup.inlineKeyboard([
      Markup.button.callback('Завершить ввод участников', 'finish_entering_participants'),
    ]));
  } else {
    await ctx.reply(`Введите имя следующего участника:`);
  }

  updateState({ participants: participants, participantsCount: participants.length })
}
