import {Context} from "telegraf";
import {Participants} from "../models";
import {logger} from "../utils";

export const whoIsMySanta = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.error('WHO_IS_MY_SANTA', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  logger.info('WHO_IS_MY_SANTA', `Пользователь ${userId} пытается узнать своего Деда-Мороза`);

  try {
    const participantId = ctx.match.input.split('_')[1];
    
    const participant: any = await Participants.findById(participantId)
      .populate('santa')
      .exec();

    if (!participant || participant.telegramAccount !== userId) {
      await ctx.answerCbQuery('У вас нет доступа');
      return;
    }

    // Шутливый ответ
    const funnyMessages = [
      'Ах ты какой, размечтался! 😄 Дед-Мороз приходит только в Новый год, гадай сам! 🎅',
      'Ха-ха! Это же секрет! 🤫 Твой Дед-Мороз сам решит, когда тебя удивить! 🎁',
      'Ого, какой любопытный! 😏 Секрет раскроется только в Новый год! Не торопи события! ⏰',
      'Терпение, друг! 🎄 Дед-Мороз работает инкогнито, узнаешь всё в новогоднюю ночь! 🌟',
      'Классика жанра - секрет! 🤐 Твой подарок готовится тайно, жди сюрприз! 🎉'
    ];

    const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

    await ctx.answerCbQuery(randomMessage, { show_alert: true });

  } catch (error) {
    logger.error('WHO_IS_MY_SANTA', 'Ошибка при обработке запроса', error);
    await ctx.answerCbQuery('Что-то пошло не так 🤷‍♂️');
  }
};

