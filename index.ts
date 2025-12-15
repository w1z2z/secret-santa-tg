import {Telegraf, Context, Markup} from 'telegraf';
import {message} from "telegraf/filters";

import config from "./config/config";
import connectDB from "./config/database";
import {getState} from "./services";
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
  start,
  home,
  myGroups,
  showGroupDetails,
  whoIsMySanta,
  setDeadline,
  enterDeadline,
  handleCalendar
} from "./handlers";

//Подключение к БД
connectDB();

const bot: Telegraf<Context> = new Telegraf(config.TG_TOKEN);

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Обработчики команд
bot.start(start);
bot.command('cancel', home);
bot.hears('🏠 Главное меню', home);
bot.hears('Главное меню', home);
bot.hears('🆕 Создать группу', (ctx: Context) => createGroup(ctx));
bot.hears('Создать группу', (ctx: Context) => createGroup(ctx)); // Для обратной совместимости
bot.hears('🚪 Присоединиться к группе', join);
bot.hears('Присоединиться к группе', join); // Для обратной совместимости
bot.hears('📋 Мои группы', myGroups);
bot.hears('Мои группы', myGroups); // Для обратной совместимости
bot.hears('📖 Инструкция к боту', instruction);
bot.hears('Инструкция к боту', instruction); // Для обратной совместимости

//Выбор действия в зависимости от текущего этапа (шага)
bot.on(message('text'), async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  if (!userId) {
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  // Проверка на кнопку "Отменить" уже обрабатывается через bot.hears выше
  // Здесь обрабатываем только текстовые сообщения для активных процессов
  
  const state = getState(userId);
  
  switch (state.currentStep) {
    case 'promptParticipants':
      //Предложить ввести участников
      await promptParticipants(ctx);
      break;

    case 'addParticipants':
      // Добавления участников в группу
      await addParticipants(ctx);
      break;

    case 'joinExistingGroup':
      // Этап присоединения к существующей группе
      await joinExistingGroup(ctx);
      break;

    // default:
    //   ctx.reply('Для начала работы выберите 1 из пунктов (Создать/Присоединиться)')
    //   break;
  }
})

//Вывод панели выбора цены подарка
bot.action('finish_entering_participants', async (ctx) => {
  await giftPriceSelection(ctx);
});

//Реакция на выбор цены подарка
bot.action(['500', '1000', '3000', '5000', '10000', '0'], async (ctx) => {
  await setDeadline(ctx);
});

//Реакция на кнопку Присоединиться
bot.action(/^join_/, async (ctx) => {
  await chooseParticipant(ctx);
})

// Реакция на просмотр деталей группы
bot.action(/^group_/, async (ctx) => {
  await showGroupDetails(ctx);
});

// Реакция на кнопку "К списку групп"
bot.action('my_groups_list', async (ctx) => {
  await ctx.deleteMessage();
  await myGroups(ctx);
});

// Реакция на кнопку "Узнать кто мой Дед-Мороз"
bot.action(/^santa_/, async (ctx) => {
  await whoIsMySanta(ctx);
});

// Реакция на действия календаря
bot.action(/^cal_/, async (ctx) => {
  await handleCalendar(ctx);
});

bot.launch().catch((err) => console.log(err));
