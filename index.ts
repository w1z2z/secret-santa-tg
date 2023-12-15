import {Telegraf, Context, Markup} from 'telegraf';
import {message} from "telegraf/filters";

import config from "./config/config";
import connectDB from "./config/database";
import {getState, initializeState, updateState} from "./services";
import {
  saveGroup,
  joinExistingGroup,
  promptParticipants,
  chooseParticipant,
  giftPriceSelection,
  addParticipants,
  createGroup,
  instruction,
  join,
  start
} from "./handlers";

//Подключение к БД
connectDB();

const bot: Telegraf<Context> = new Telegraf(config.TG_TOKEN);

initializeState({
  currentStep: 'newSanta',
  newSantaName: '',
  participantsCount: 0,
  participants: [],
});


// Обработчики команд
bot.start(start);
bot.hears('Создать группу', (ctx: Context) => createGroup(ctx));
bot.hears('Присоединиться к группе', join);
bot.hears('Инструкция к боту', instruction);

//Выбор действия в зависимости от текущего этапа (шага)
bot.on(message('text'), async (ctx: any): Promise<void> => {
  switch (getState().currentStep) {
    case 'promptParticipants':
      //Предложить ввести участников
      promptParticipants(ctx)
      break;

    case 'addParticipants':
      // Добавления участников в группу
      addParticipants(ctx);
      break;

    case 'joinExistingGroup':
      // Этап присоединения к существующей группе
      joinExistingGroup(ctx);
      break;

    case 'chooseGiftPrice':
      // Выбор стоимости подарка
      giftPriceSelection(ctx);
      break;

    // default:
    //   ctx.reply('Для начала работы выберите 1 из пунктов (Создать/Присоединиться)')
    //   break;
  }
})

//Вывод панели выбора цены подарка
bot.action('finish_entering_participants', async (ctx) => {
  await ctx.reply('Выберите максимальную стоимость подарка:', Markup.inlineKeyboard([
    Markup.button.callback('до 500 руб.', '500'),
    Markup.button.callback('до 1000 руб.', '1000'),
    Markup.button.callback('до 3000 руб.', '3000'),
    Markup.button.callback('до 5000 руб.', '5000'),
    Markup.button.callback('до 10000 руб.', '10000'),
    Markup.button.callback('Без ограничений.', '0'),
  ]))
  updateState({ currentStep: 'saveGroup' })
});

//Реакция на выбор цены подарка
bot.action(['500', '1000', '3000', '5000', '10000', '0'], async (ctx) => {
  saveGroup(ctx);
});

//Реакция на кнопку Присоединиться
bot.action(/^join_/, async (ctx) => {
  chooseParticipant(ctx);
})

bot.launch().catch((err) => console.log(err));
