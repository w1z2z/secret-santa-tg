import {Markup} from "telegraf";

export const getMainMenuKeyboard = () => {
  return Markup.keyboard([
    ['🆕 Создать группу', '🚪 Присоединиться к группе'],
    ['📋 Мои группы', '📖 Инструкция к боту']
  ]).resize();
};

export const getHomeButton = () => {
  return Markup.keyboard([
    ['🏠 Главное меню']
  ]).resize();
};

