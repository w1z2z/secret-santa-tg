import {Context, Markup} from "telegraf";

import {Participants, Santa} from "../models";
import {getState, updateState} from "../services";

export const joinExistingGroup = async (ctx: any): Promise<void> => {
  try {
    const secretCode = ctx.message.text; // Получение введенного секретного кода
    const santa = await Santa.findOne({ code: secretCode }).populate('participants'); // Поиск группы по коду

    if (!santa) {
      await ctx.reply('Группа по указанному коду не найдена'); // Уведомление об отсутствии группы по коду
      return;
    }

    const activeUsers = santa.participants.filter((user: any) => user.telegramAccount !== null);
    const inactiveUsers = santa.participants.filter((user: any) => user.telegramAccount === null);

    const existingUser: any = await Participants.findOne({
      santa: santa._id, // Поиск участника в группе
      telegramAccount: ctx.from?.id,
    }).populate('recipient');

    if (existingUser) {
      const activeUserNames = activeUsers.map((user: any) => user.name).join(', ');
      const inactiveUserNames = inactiveUsers.map((user: any) => user.name).join(', ');

      await ctx.reply(
        `Вы уже участвуете в группе - *${santa.name}* 🎄\n\n` +
        `Ваше имя - *${existingUser.name}* 👤\n\n` +
        `Вам нужно подготовить подарок для - *${existingUser.recipient?.name}* 🎁\n\n` +
        `Цена подарка - *${santa.giftPrice === '0' ? 'Без ограничений' : 'до ' + santa.giftPrice + ' руб.'}* 💰\n\n` +
        `Активные участники - *${activeUserNames}* ✅\n\n` +
        `Неактивные участники - *${inactiveUserNames}* ❌`,
        {parse_mode: "Markdown"}
      );
      // Уведомление участника о его участии в группе и подготовке подарка
    } else {
      const participants = await Participants.find({
        santa: santa._id, // Поиск доступных участников в группе
        telegramAccount: null,
      });

      if (participants.length > 0) {
        const participantButtons = participants.map((participant: any) =>
          Markup.button.callback(`${participant.name}`, `join_${participant._id}`),
        );

        await ctx.reply('Выберите себя из списка участников группы:',
          Markup.inlineKeyboard(participantButtons, { columns: 5 })
        )

        updateState({ currentStep: 'chooseParticipant' })
      } else {
        await ctx.reply('Нет доступных участников');
        updateState({ currentStep: 'newSanta' })

      }
    }
  } catch (error) {
    await ctx.reply('Произошла ошибка при поиске группы');
    console.error('Произошла ошибка при поиске группы:', error);
    updateState({ currentStep: 'newSanta' })
  }
};
