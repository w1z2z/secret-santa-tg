import {Markup} from "telegraf";
import {getState, updateState} from "../services";
import {getHomeButton, getMainMenuKeyboard, logger, getUserIdentifier} from "../utils";

export const addParticipants = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.error('ADD_PARTICIPANTS', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const currentState = getState(userId);
  const newParticipant = ctx.message?.text?.trim();
  const userIdentifier = getUserIdentifier(ctx.from);
  logger.info('ADD_PARTICIPANTS', `Пользователь ${userIdentifier} добавил участника: "${newParticipant}"`);

  // Удаляем сообщение пользователя с именем участника
  try {
    if (ctx.message?.message_id && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
  } catch (e) {
    // Игнорируем ошибку
  }

  if (!newParticipant) {
    await ctx.reply('Пожалуйста, введите имя участника');
    return;
  }

  // Проверка на дубликаты
  if (currentState.participants.includes(newParticipant)) {
    logger.info('ADD_PARTICIPANTS', `Пользователь ${userIdentifier}: Попытка добавить дубликат участника "${newParticipant}"`);
    await ctx.reply(`Участник "${newParticipant}" уже добавлен. Введите другое имя.`);
    return;
  }

  const updatedParticipants = [...currentState.participants, newParticipant];
  logger.info('ADD_PARTICIPANTS', `Пользователь ${userIdentifier}: Всего участников: ${updatedParticipants.length}`);

  // Удаляем предыдущее сообщение бота и сообщение с меню (если есть)
  try {
    if (currentState.lastBotMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, currentState.lastBotMessageId);
    }
    if (currentState.lastMenuMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, currentState.lastMenuMessageId);
    }
  } catch (e) {
    // Игнорируем ошибку
  }

  let sentMessage;
  if (updatedParticipants.length >= 3) {
    // Отправляем сообщение с inline кнопкой
    const inlineKeyboard = Markup.inlineKeyboard([
      Markup.button.callback('Завершить ввод участников', 'finish_entering_participants'),
    ]);
    
    sentMessage = await ctx.reply(
      `Введенные участники: ${updatedParticipants.join(', ')}\n\nВы можете продолжить добавлять участников или завершить ввод.`,
      inlineKeyboard
    );
    
    // Отправляем отдельное сообщение для установки reply keyboard (кнопки над полем ввода)
    const menuMessage = await ctx.reply('✨', getMainMenuKeyboard());
    
    // Сохраняем message_id сообщения с меню для последующего удаления
    updateState(userId, { 
      participants: updatedParticipants, 
      participantsCount: updatedParticipants.length,
      lastBotMessageId: sentMessage.message_id,
      lastMenuMessageId: menuMessage.message_id
    });
    return;
  } else {
    sentMessage = await ctx.reply(`Введите имя следующего участника (добавлено: ${updatedParticipants.length}, минимум: 3):`, getHomeButton());
    
    updateState(userId, { 
      participants: updatedParticipants, 
      participantsCount: updatedParticipants.length,
      lastBotMessageId: sentMessage.message_id
    });
  }
}
