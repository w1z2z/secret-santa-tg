import {Context, Markup} from "telegraf";
import {getHomeButton} from "../utils";
import {updateState} from "../services";

export const giftPriceSelection = async (ctx: Context): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  await ctx.reply('Выберите максимальную стоимость подарка:', Markup.inlineKeyboard([
    Markup.button.callback('до 500 руб.', '500'),
    Markup.button.callback('до 1000 руб.', '1000'),
    Markup.button.callback('до 3000 руб.', '3000'),
    Markup.button.callback('до 5000 руб.', '5000'),
    Markup.button.callback('до 10000 руб.', '10000'),
    Markup.button.callback('Без ограничений.', '0'),
  ], { columns: 2 }));

  // После выбора цены переходим к вводу дедлайна
  // Но сначала нужно сохранить выбранную цену
}
