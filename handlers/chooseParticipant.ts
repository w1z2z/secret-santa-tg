import mongoose from "mongoose";
import {Participants} from "../models";
import {getRandomParticipant} from "../utils";
import {getState, clearState} from "../services";

export const chooseParticipant = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const state = getState(userId);
  
  if (state.currentStep !== 'chooseParticipant') {
    await ctx.reply('Неверный шаг. Начните заново с команды /start');
    return;
  }

  const participantId = ctx.match.input.split('_')[1];

  if (!participantId || !mongoose.Types.ObjectId.isValid(participantId)) {
    await ctx.reply('Неверный ID участника');
    return;
  }

  // Используем транзакцию для предотвращения race condition
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Находим участника по ID с блокировкой
    const participant: any = await Participants.findById(participantId)
      .populate('recipient')
      .populate('santa')
      .session(session)
      .exec();

    if (!participant) {
      await session.abortTransaction();
      await ctx.reply('Участник не найден');
      return;
    }

    // Проверка: участник уже привязан к другому аккаунту
    if (participant.telegramAccount && participant.telegramAccount !== userId) {
      await session.abortTransaction();
      await ctx.reply('Этот участник уже привязан к другому аккаунту');
      return;
    }

    // Проверка: пользователь уже выбрал участника в этой группе
    const existingUserParticipant = await Participants.findOne({
      santa: participant.santa,
      telegramAccount: userId,
    }).session(session);

    if (existingUserParticipant && existingUserParticipant._id.toString() !== participantId) {
      await session.abortTransaction();
      await ctx.reply('Вы уже выбрали другого участника в этой группе');
      return;
    }

    // Привязываем аккаунт Telegram пользователя к участнику
    participant.telegramAccount = userId;

    // Находим доступных участников (не самих себя, не тех кто уже получил подарок)
    // Важно: получатель должен быть из всех участников группы, независимо от того присоединился ли он
    const users = await Participants.find({
      santa: participant.santa,
      name: { $ne: participant.name },
      isGifted: false,
    }).session(session);

    if (users.length === 0) {
      await session.abortTransaction();
      await ctx.reply('Нет доступных получателей. Подождите, пока все участники присоединятся к группе.');
      return;
    }

    // Выбираем случайного получателя
    const recipient = getRandomParticipant(users);
    participant.recipient = recipient._id;

    // Помечаем получателя как "получил подарок" (чтобы другие его не выбрали)
    const recipientDoc: any = await Participants.findById(recipient._id).session(session);
    if (recipientDoc) {
      recipientDoc.isGifted = true;
      await recipientDoc.save({ session });
    }

    await participant.save({ session });

    // Подтверждаем транзакцию
    await session.commitTransaction();

    await ctx.reply(
      `Вы присоединились к группе *${participant?.santa?.name}*🎄\n\n` +
      `Ваше имя - *${participant.name}*👤\n\n` +
      `Вам нужно подготовить подарок для - *${recipient.name}*🎁\n\n` +
      `Предполагаемая цена подарка - *${participant.santa.giftPrice === "0" ? 'Без ограничений' : 'до ' + participant.santa.giftPrice + ' руб.'}* 💰`,
      {parse_mode: "Markdown"}
    );

    clearState(userId);

  } catch (error: any) {
    await session.abortTransaction();
    
    if (error.message && error.message.includes('Массив участников пуст')) {
      await ctx.reply('Нет доступных получателей. Подождите, пока все участники присоединятся к группе.');
    } else {
      await ctx.reply('Произошла ошибка при присоединении участника!');
      console.error('Произошла ошибка при присоединении участника:', error);
    }
  } finally {
    await session.endSession();
  }
}
