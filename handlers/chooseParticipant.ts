import {Participants} from "../models";
import {getRandomParticipant} from "../utils";
import {getState, updateState} from "../services";

export const chooseParticipant = async (ctx: any): Promise<void> => {
  const participantId = ctx.match.input.split('_')[1];

  if (getState().currentStep === 'chooseParticipant') {
    try {
      // Находим участника по ID
      const participant: any = await Participants.findById(participantId).populate('recipient').populate('santa').exec();

      if (participant) {
        // Привязываем аккаунт Telegram пользователя к участнику
        participant.telegramAccount = ctx.from.id;

        const users = await Participants.find({
          santa: participant.santa,
          name: { $ne: participant.name },
          isGifted: false
        });

        participant.recipient = getRandomParticipant(users);

        const recipient: any = await Participants.findById(participant.recipient._id);

        recipient.isGifted = true;

        await recipient.save();
        await participant.save();

        await ctx.reply(
          `Вы присоединились к группе *${participant?.santa?.name}*🎄\n\n` +
          `Ваше имя - *${participant.name}*👤\n\n` +
          `Вам нужно подготовить подарок для - *${participant.recipient.name}*🎁\n\n` +
          `Предполагаемая цена подарка - *${participant.santa.giftPrice === "0" ? 'Без ограничений' : 'до ' + participant.santa.giftPrice + ' руб.'}* 💰`
          ,{parse_mode: "Markdown"});

        updateState({ currentStep: 'newSanta' });

      } else {
        await ctx.reply('Участник не найден');
      }
    } catch (error) {
      await ctx.reply('Произошла ошибка при присоединении участника!');
      console.error('Произошла ошибка при присоединении участника:', error);
    }
  }
}
