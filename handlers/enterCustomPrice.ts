import {Context} from "telegraf";
import {getState, updateState} from "../services";
import {getHomeButton, logger, getUserIdentifier} from "../utils";
import {setDeadline} from "./setDeadline";

export const promptCustomPrice = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.error('PROMPT_CUSTOM_PRICE', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const userIdentifier = getUserIdentifier(ctx.from);
  logger.info('PROMPT_CUSTOM_PRICE', `Пользователь ${userIdentifier} выбрал ввод своей суммы`);

  // Удаляем старое сообщение с выбором цены
  try {
    await ctx.deleteMessage();
  } catch (e) {
    // Игнорируем ошибку
  }

  await ctx.answerCbQuery();
  
  const state = getState(userId);
  
  // Удаляем предыдущее сообщение с меню (если есть)
  try {
    if (state.lastMenuMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, state.lastMenuMessageId);
    }
  } catch (e) {
    // Игнорируем ошибку
  }
  
  const sentMessage = await ctx.reply(
    '💵 Введите максимальную стоимость подарка в рублях (только число, например: 1500):',
    getHomeButton()
  );

  updateState(userId, { 
    currentStep: 'enterCustomPrice',
    lastBotMessageId: sentMessage.message_id
  });
};

export const enterCustomPrice = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    logger.error('ENTER_CUSTOM_PRICE', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const priceText = ctx.message?.text?.trim();
  const userIdentifier = getUserIdentifier(ctx.from);
  logger.info('ENTER_CUSTOM_PRICE', `Пользователь ${userIdentifier} ввел цену: "${priceText}"`);
  
  // Удаляем сообщение пользователя с суммой
  try {
    if (ctx.message?.message_id && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, ctx.message.message_id);
    }
  } catch (e) {
    // Игнорируем ошибку
  }
  
  if (!priceText) {
    await ctx.reply('Пожалуйста, введите сумму в рублях', getHomeButton());
    return;
  }

  // Валидация: проверяем, что это число
  const priceNumber = parseInt(priceText);
  if (isNaN(priceNumber) || priceNumber < 0) {
    logger.info('ENTER_CUSTOM_PRICE', `Пользователь ${userIdentifier}: Некорректная цена введена: "${priceText}"`);
    await ctx.reply('❌ Пожалуйста, введите корректное число (например: 1500)', getHomeButton());
    return;
  }

  logger.info('ENTER_CUSTOM_PRICE', `Пользователь ${userIdentifier}: Цена сохранена: ${priceNumber} руб.`);
  
  // Сохраняем цену
  updateState(userId, { 
    giftPrice: priceNumber.toString(), 
    currentStep: 'selectDeadline' 
  });

  const state = getState(userId);
  
  // Удаляем предыдущее сообщение бота (запрос на ввод суммы) и сообщение с меню (если есть)
  try {
    if (state.lastBotMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, state.lastBotMessageId);
    }
    if (state.lastMenuMessageId && ctx.chat?.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, state.lastMenuMessageId);
    }
  } catch (e) {
    // Игнорируем ошибку
  }

  // Вызываем setDeadline с мок-контекстом, чтобы показать календарь
  // setDeadline ожидает ctx.match[0] для получения цены
  const mockCtx = {
    ...ctx,
    from: ctx.from,
    match: [priceNumber.toString()],
    reply: ctx.reply.bind(ctx),
    deleteMessage: ctx.deleteMessage?.bind(ctx)
  };
  
  await setDeadline(mockCtx);
};

