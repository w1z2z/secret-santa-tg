import {Context, Markup} from "telegraf";
import mongoose from "mongoose";

import {Participants, Santa} from "../models";
import {getState, updateState, clearState} from "../services";

export const joinExistingGroup = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  try {
    const secretCodeInput = ctx.message?.text?.trim();
    
    // Валидация кода
    if (!secretCodeInput) {
      await ctx.reply('Пожалуйста, введите секретный код', Markup.keyboard([
        ['Отменить']
      ]).resize());
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
      await ctx.reply('Группа по указанному коду не найдена');
      clearState(userId);
      return;
    }

    const activeUsers = santa.participants.filter((user: any) => user.telegramAccount !== null);
    const inactiveUsers = santa.participants.filter((user: any) => user.telegramAccount === null);

    const existingUser: any = await Participants.findOne({
      santa: santa._id,
      telegramAccount: userId,
    }).populate('recipient');

    if (existingUser) {
      const activeUserNames = activeUsers.map((user: any) => user.name).join(', ');
      const inactiveUserNames = inactiveUsers.map((user: any) => user.name).join(', ');

      await ctx.reply(
        `Вы уже участвуете в группе - *${santa.name}* 🎄\n\n` +
        `Ваше имя - *${existingUser.name}* 👤\n\n` +
        `Вам нужно подготовить подарок для - *${existingUser.recipient?.name}* 🎁\n\n` +
        `Цена подарка - *${santa.giftPrice === '0' ? 'Без ограничений' : 'до ' + santa.giftPrice + ' руб.'}* 💰\n\n` +
        `Активные участники - *${activeUserNames || 'нет'}* ✅\n\n` +
        `Неактивные участники - *${inactiveUserNames || 'нет'}* ❌`,
        {parse_mode: "Markdown"}
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

        updateState(userId, { currentStep: 'chooseParticipant' });
      } else {
        await ctx.reply('Нет доступных участников');
        clearState(userId);
      }
    }
  } catch (error) {
    await ctx.reply('Произошла ошибка при поиске группы');
    console.error('Произошла ошибка при поиске группы:', error);
    clearState(userId);
  }
};
