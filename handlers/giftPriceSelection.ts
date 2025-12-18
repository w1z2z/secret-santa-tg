import {Context, Markup} from "telegraf";
import {getHomeButton, getMainMenuKeyboard, logger, getUserIdentifier} from "../utils";
import {updateState, getState} from "../services";

export const giftPriceSelection = async (ctx: Context): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.error('GIFT_PRICE_SELECTION', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const userIdentifier = getUserIdentifier(ctx.from);
  logger.info('GIFT_PRICE_SELECTION', `Пользователь ${userIdentifier} перешел к выбору цены подарка`);

  // Удаляем старое сообщение (если это action handler)
  try {
    if (ctx.callbackQuery) {
      await ctx.deleteMessage();
    }
  } catch (e) {
    // Игнорируем ошибку, если это не inline сообщение
  }

  const state = getState(userId);
  
  // Удаляем предыдущее сообщение бота (если есть)
  try {
    if (state.lastBotMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, state.lastBotMessageId);
    }
  } catch (e) {
    // Игнорируем ошибку
  }

  const inlineKeyboard = Markup.inlineKeyboard([
    Markup.button.callback('на 500 руб.', '500'),
    Markup.button.callback('на 1000 руб.', '1000'),
    Markup.button.callback('на 3000 руб.', '3000'),
    Markup.button.callback('на 5000 руб.', '5000'),
    Markup.button.callback('на 10000 руб.', '10000'),
    Markup.button.callback('Без ограничений', '0'),
    Markup.button.callback('💵 Ввести свою сумму', 'custom_price'),
  ], { columns: 2 });
  
  const sentMessage = await ctx.reply('Выберите максимальную стоимость подарка:', inlineKeyboard);
  
  // Удаляем предыдущее сообщение с меню (если есть)
  try {
    if (state.lastMenuMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, state.lastMenuMessageId);
    }
  } catch (e) {
    // Игнорируем ошибку
  }
  
  // Отправляем отдельное сообщение для установки reply keyboard (кнопки над полем ввода)
  const menuMessage = await ctx.reply('✨', getMainMenuKeyboard());

  updateState(userId, { 
    lastBotMessageId: sentMessage.message_id,
    lastMenuMessageId: menuMessage.message_id
  });

  // После выбора цены переходим к вводу дедлайна
  // Но сначала нужно сохранить выбранную цену
}
