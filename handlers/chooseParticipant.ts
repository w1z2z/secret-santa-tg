import mongoose from "mongoose";
import {Markup} from "telegraf";
import {Participants} from "../models";
import {getRandomParticipant, getMainMenuKeyboard, logger, getUserIdentifier} from "../utils";
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

  try {
    // Используем findOneAndUpdate для атомарной операции без транзакций
    // Проверяем, что участник еще не привязан или привязан к текущему пользователю
    const participant: any = await Participants.findOne({
      _id: participantId,
      $or: [
        { telegramAccount: null },
        { telegramAccount: userId }
      ]
    }).populate('recipient').populate('santa').exec();

    if (!participant) {
      await ctx.reply('Участник не найден или уже привязан к другому аккаунту');
      return;
    }

    // Проверка: пользователь уже выбрал участника в этой группе
    const existingUserParticipant = await Participants.findOne({
      santa: participant.santa,
      telegramAccount: userId,
      _id: { $ne: participantId }
    });

    if (existingUserParticipant) {
      await ctx.reply('Вы уже выбрали другого участника в этой группе');
      return;
    }

    // Атомарно обновляем participant с проверкой, что он еще не привязан
    const updatedParticipant: any = await Participants.findOneAndUpdate(
      {
        _id: participantId,
        $or: [
          { telegramAccount: null },
          { telegramAccount: userId }
        ]
      },
      { telegramAccount: userId },
      { new: true }
    ).populate('santa').exec();

    if (!updatedParticipant) {
      await ctx.reply('Не удалось привязать участника. Попробуйте еще раз.');
      return;
    }

    // Находим доступных участников (не самих себя, не тех кто уже получил подарок)
        const users = await Participants.find({
      santa: updatedParticipant.santa,
      name: { $ne: updatedParticipant.name },
      isGifted: false,
        });

    if (users.length === 0) {
      await ctx.reply('Нет доступных получателей. Подождите, пока все участники присоединятся к группе.');
      // Откатываем привязку, если нет получателей
      await Participants.findByIdAndUpdate(participantId, { telegramAccount: null });
      return;
    }

    // Выбираем случайного получателя
    const recipient = getRandomParticipant(users);

    // Атомарно обновляем участника с получателем и помечаем получателя как "получил подарок"
    // Используем findOneAndUpdate для атомарности
    const recipientDoc: any = await Participants.findOneAndUpdate(
      { _id: recipient._id, isGifted: false },
      { isGifted: true },
      { new: true }
    );

    if (!recipientDoc) {
      // Получатель уже был выбран другим пользователем, выбираем другого
      const remainingUsers = await Participants.find({
        santa: updatedParticipant.santa,
        name: { $ne: updatedParticipant.name },
        isGifted: false,
      });

      if (remainingUsers.length === 0) {
        await ctx.reply('Нет доступных получателей. Подождите, пока все участники присоединятся к группе.');
        await Participants.findByIdAndUpdate(participantId, { telegramAccount: null });
        return;
      }

      const newRecipient = getRandomParticipant(remainingUsers);
      await Participants.findByIdAndUpdate(newRecipient._id, { isGifted: true });
      updatedParticipant.recipient = newRecipient._id;
    } else {
      updatedParticipant.recipient = recipientDoc._id;
    }

    await updatedParticipant.save();

    const finalParticipant: any = await Participants.findById(participantId)
      .populate('recipient')
      .populate('santa')
      .exec();

    // Удаляем сообщение со списком участников перед показом результата
    try {
      await ctx.deleteMessage();
    } catch (e) {
      // Игнорируем ошибку, если сообщение уже удалено
    }

    // Удаляем предыдущее сообщение с меню (если есть)
    const state = getState(userId);
    try {
      if (state.lastMenuMessageId && ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, state.lastMenuMessageId);
      }
    } catch (e) {
      // Игнорируем ошибку
    }

    let deadlineText = '';
    if (finalParticipant.santa.deadline) {
      const deadlineDate = new Date(finalParticipant.santa.deadline);
      const formattedDeadline = deadlineDate.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      deadlineText = `Дедлайн - *${formattedDeadline}* 📅\n\n`;
    }

        await ctx.reply(
      `Вы присоединились к группе *${finalParticipant?.santa?.name}* 🎄\n\n` +
      `Ваше имя - *${finalParticipant.name}* 👤\n\n` +
      `Вам нужно подготовить подарок для - *${finalParticipant.recipient.name}* 🎁\n\n` +
      `Предполагаемая цена подарка - *${finalParticipant.santa.giftPrice === "0" ? 'Без ограничений' : 'до ' + finalParticipant.santa.giftPrice + ' руб.'}* 💰\n\n` +
      deadlineText,
      {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🎅 Узнать кто мой Дед-Мороз?', `santa_${finalParticipant._id}`)]
        ]).reply_markup
      }
    );

    // Отправляем главное меню отдельным сообщением для установки клавиатуры
    await ctx.reply('✨', getMainMenuKeyboard());

    clearState(userId);

  } catch (error: any) {
    if (error.message && error.message.includes('Массив участников пуст')) {
      await ctx.reply('Нет доступных получателей. Подождите, пока все участники присоединятся к группе.');
    } else {
      await ctx.reply('Произошла ошибка при присоединении участника!');
      const userIdentifier = getUserIdentifier(ctx.from);
      logger.error('CHOOSE_PARTICIPANT', `Пользователь ${userIdentifier}: Ошибка при присоединении участника`, error);
    }
  }
}
