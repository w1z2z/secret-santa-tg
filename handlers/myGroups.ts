import {Context, Markup} from "telegraf";
import {Participants, Santa} from "../models";

export const myGroups = async (ctx: Context): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  try {
    // Находим все группы, где пользователь участвует
    const userParticipants = await Participants.find({
      telegramAccount: userId,
    }).populate('santa').populate('recipient').exec();

    if (!userParticipants || userParticipants.length === 0) {
      await ctx.reply(
        'Вы пока не участвуете ни в одной группе 🎄\n\nСоздайте новую группу или присоединитесь к существующей!',
        Markup.keyboard([
          ['🆕 Создать группу', '🚪 Присоединиться к группе'],
          ['📋 Мои группы', '📖 Инструкция к боту']
        ]).resize()
      );
      return;
    }

    // Формируем список групп с кнопками
    const groupButtons = userParticipants.map((participant: any, index: number) => {
      const santa = participant.santa;
      const groupTitle = `${index + 1}. ${santa.name}${participant.recipient ? ' ✅' : ''}`;
      return [Markup.button.callback(groupTitle, `group_${participant._id}`)];
    });

    await ctx.reply(
      `*Ваши группы 🎄*\n\nВыберите группу для просмотра деталей:`,
      Markup.inlineKeyboard(groupButtons)
    );

  } catch (error) {
    console.error('Ошибка при получении списка групп:', error);
    await ctx.reply('Произошла ошибка при загрузке ваших групп. Попробуйте позже.');
  }
};

export const showGroupDetails = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  try {
    const participantId = ctx.match.input.split('_')[1];
    
    const participant: any = await Participants.findById(participantId)
      .populate('santa')
      .populate('recipient')
      .exec();

    if (!participant) {
      await ctx.answerCbQuery('Группа не найдена');
      return;
    }

    if (participant.telegramAccount !== userId) {
      await ctx.answerCbQuery('У вас нет доступа к этой группе');
      return;
    }

    const santa = participant.santa;
    
    // Получаем всех участников группы для статистики
    const allParticipants = await Participants.find({ santa: santa._id });
    const activeCount = allParticipants.filter((p: any) => p.telegramAccount !== null).length;
    const totalCount = allParticipants.length;

    let message = `*Группа: ${santa.name}* 🎄\n\n`;
    message += `*Ваше имя:* ${participant.name} 👤\n\n`;

    if (participant.recipient) {
      message += `*Получатель подарка:* ${participant.recipient.name} 🎁\n\n`;
    } else {
      message += `*Получатель подарка:* еще не назначен ⏳\n\n`;
    }

    message += `*Цена подарка:* ${santa.giftPrice === '0' ? 'Без ограничений' : 'до ' + santa.giftPrice + ' руб.'} 💰\n\n`;
    if (santa.deadline) {
      const deadlineDate = new Date(santa.deadline);
      const formattedDeadline = deadlineDate.toLocaleDateString('ru-RU', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
      message += `*Дедлайн:* ${formattedDeadline} 📅\n\n`;
    }
    message += `*Код группы:* \`${santa.code}\` 🔑\n\n`;
    message += `*Статус:* ${activeCount}/${totalCount} участников присоединилось ✅\n\n`;

    // Список всех участников
    const participantNames = allParticipants.map((p: any) => {
      const status = p.telegramAccount ? '✅' : '❌';
      return `${status} ${p.name}`;
    }).join('\n');

    message += `*Участники группы:*\n${participantNames}`;

    // Удаляем старое сообщение перед показом деталей
    try {
      await ctx.deleteMessage();
      // Отправляем детали как новое сообщение
      await ctx.reply(message, {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔙 К списку групп', 'my_groups_list')]
        ]).reply_markup
      });
    } catch (e) {
      // Если не удалось удалить, используем editMessageText
      await ctx.editMessageText(message, {
        parse_mode: "Markdown",
        reply_markup: Markup.inlineKeyboard([
          [Markup.button.callback('🔙 К списку групп', 'my_groups_list')]
        ]).reply_markup
      });
    }

    await ctx.answerCbQuery();

  } catch (error) {
    console.error('Ошибка при получении деталей группы:', error);
    await ctx.answerCbQuery('Произошла ошибка при загрузке информации о группе');
  }
};

