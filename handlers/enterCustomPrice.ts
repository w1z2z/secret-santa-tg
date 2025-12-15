import {Context} from "telegraf";
import {getState, updateState} from "../services";
import {getHomeButton} from "../utils";
import {setDeadline} from "./setDeadline";

export const promptCustomPrice = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  // Удаляем старое сообщение с выбором цены
  try {
    await ctx.deleteMessage();
  } catch (e) {
    // Игнорируем ошибку
  }

  await ctx.answerCbQuery();
  
  await ctx.reply(
    '💵 Введите максимальную стоимость подарка в рублях (только число, например: 1500):',
    getHomeButton()
  );

  updateState(userId, { currentStep: 'enterCustomPrice' });
};

export const enterCustomPrice = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const priceText = ctx.message?.text?.trim();
  
  if (!priceText) {
    await ctx.reply('Пожалуйста, введите сумму в рублях', getHomeButton());
    return;
  }

  // Валидация: проверяем, что это число
  const priceNumber = parseInt(priceText);
  if (isNaN(priceNumber) || priceNumber < 0) {
    await ctx.reply('❌ Пожалуйста, введите корректное число (например: 1500)', getHomeButton());
    return;
  }

  // Сохраняем цену
  updateState(userId, { 
    giftPrice: priceNumber.toString(), 
    currentStep: 'selectDeadline' 
  });

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

