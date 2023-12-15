import {Context, Markup} from "telegraf";

export const start = (ctx: Context) => {
  return ctx.reply('Привет! Я "Тайный Дед-Мороз"! 🎅\n\nПеред использованием прочтите инструкцию! 😉', Markup.keyboard([
    ['Создать группу', 'Присоединиться к группе'],
    ['Инструкция к боту']
  ]).resize());
}
