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

    // default:
    //   ctx.reply('Для начала работы выберите 1 из пунктов (Создать/Присоединиться)')
    //   break;
  }
})

//Вывод панели выбора цены подарка
bot.action('finish_entering_participants', async (ctx) => {
  giftPriceSelection(ctx)
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
