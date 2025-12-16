import {Context, Markup} from "telegraf";
import mongoose from "mongoose";

import {Participants, Santa} from "../models";
import {getState, updateState, clearState} from "../services";
import {getHomeButton, getMainMenuKeyboard, logger, getUserIdentifier} from "../utils";

export const joinExistingGroup = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.error('JOIN_EXISTING_GROUP', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  try {
    const secretCodeInput = ctx.message?.text?.trim();
    const userIdentifier = getUserIdentifier(ctx.from);
    logger.info('JOIN_EXISTING_GROUP', `Пользователь ${userIdentifier} пытается присоединиться с кодом: ${secretCodeInput}`);
    
    // Удаляем сообщение пользователя с кодом группы
    try {
      if (ctx.message?.message_id && ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
      }
    } catch (e) {
      // Игнорируем ошибку
    }
    
    // Валидация кода
    if (!secretCodeInput) {
      await ctx.reply('Пожалуйста, введите секретный код', getHomeButton());
      return;
    }

    const secretCode = parseInt(secretCodeInput, 10);
    
    // Проверка, что код - валидное число
    if (isNaN(secretCode) || secretCode < 100000 || secretCode > 999999) {
      await ctx.reply('Неверный формат кода. Код должен быть числом из 6 цифр (от 100000 до 999999)');
      return;
    }

    const santa = await Santa.findOne({ code: secretCode }).populate('participants');

    if (!santa) {
      logger.info('JOIN_EXISTING_GROUP', `Пользователь ${userIdentifier}: Группа с кодом ${secretCode} не найдена`);
      await ctx.reply('Группа по указанному коду не найдена');
      clearState(userId);
      return;
    }
    
    logger.info('JOIN_EXISTING_GROUP', `Найдена группа "${santa.name}" с кодом ${secretCode}`);

    const activeUsers = santa.participants.filter((user: any) => user.telegramAccount !== null);
    const inactiveUsers = santa.participants.filter((user: any) => user.telegramAccount === null);

    const existingUser: any = await Participants.findOne({
      santa: santa._id,
      telegramAccount: userId,
    }).populate('recipient');

    if (existingUser) {
      logger.info('JOIN_EXISTING_GROUP', `Пользователь ${userIdentifier} уже участвует в группе "${santa.name}"`);
      const activeUserNames = activeUsers.map((user: any) => user.name).join(', ');
      const inactiveUserNames = inactiveUsers.map((user: any) => user.name).join(', ');

      let deadlineText = '';
      if (santa.deadline) {
        const deadlineDate = new Date(santa.deadline);
        const formattedDeadline = deadlineDate.toLocaleDateString('ru-RU', { 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        deadlineText = `Дедлайн - *${formattedDeadline}* 📅\n\n`;
      }

      await ctx.reply(
        `Вы уже участвуете в группе - *${santa.name}* 🎄\n\n` +
        `Ваше имя - *${existingUser.name}* 👤\n\n` +
        `Вам нужно подготовить подарок для - *${existingUser.recipient?.name}* 🎁\n\n` +
        `Цена подарка - *${santa.giftPrice === '0' ? 'Без ограничений' : 'до ' + santa.giftPrice + ' руб.'}* 💰\n\n` +
        deadlineText +
        `Активные участники - *${activeUserNames || 'нет'}* ✅\n\n` +
        `Неактивные участники - *${inactiveUserNames || 'нет'}* ❌`,
        {
          parse_mode: "Markdown",
          ...getMainMenuKeyboard()
        }
      );
      clearState(userId);
    } else {
      const participants = await Participants.find({
        santa: santa._id,
        telegramAccount: null,
      });

      if (participants.length > 0) {
        const participantButtons = participants.map((participant: any) =>
          Markup.button.callback(`${participant.name}`, `join_${participant._id}`),
        );

        await ctx.reply('Выберите себя из списка участников группы:',
          Markup.inlineKeyboard(participantButtons, { columns: 5 })
        );

        logger.info('JOIN_EXISTING_GROUP', `Пользователь ${userIdentifier} выбирает участника из группы "${santa.name}"`);
        updateState(userId, { currentStep: 'chooseParticipant' });
      } else {
        logger.info('JOIN_EXISTING_GROUP', `Пользователь ${userIdentifier}: Нет доступных участников в группе "${santa.name}"`);
        await ctx.reply('Нет доступных участников');
        clearState(userId);
      }
    }
  } catch (error) {
    logger.error('JOIN_EXISTING_GROUP', 'Ошибка при поиске группы', error);
    await ctx.reply('Произошла ошибка при поиске группы');
    clearState(userId);
  }
};
