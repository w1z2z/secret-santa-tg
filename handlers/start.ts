import {Context, Markup} from "telegraf";
import {logger, getHomeButton} from "../utils";
import {Santa} from "../models";
import {updateState} from "../services";

export const start = async (ctx: Context) => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    return ctx.reply('Ошибка: не удалось определить пользователя');
  }
  
  // Проверяем наличие параметра в deep link (start payload)
  // В Telegraf параметры команды доступны через ctx.startPayload
  const ctxAny = ctx as any;
  const startPayload = ctxAny.startPayload || (ctx.message && 'text' in ctx.message ? ctx.message.text.split(' ')[1] : undefined);
  
  if (startPayload) {
    // Если есть параметр - это код группы для автоматического присоединения
    const secretCode = parseInt(startPayload, 10);
    
    if (!isNaN(secretCode) && secretCode >= 100000 && secretCode <= 999999) {
      logger.info('START', `Пользователь ${userId} перешел по deep link с кодом: ${secretCode}`);
      
      // Проверяем, существует ли группа с таким кодом
      const santa = await Santa.findOne({ code: secretCode }).populate('participants');
      
      if (santa) {
        // Устанавливаем состояние для присоединения
        updateState(userId, { currentStep: 'joinExistingGroup' });
        
        // Автоматически вызываем обработчик присоединения
        // Временно изменяем текст сообщения на код группы
        const originalText = ctx.message && 'text' in ctx.message ? ctx.message.text : undefined;
        if (ctx.message && 'text' in ctx.message) {
          (ctx.message as any).text = secretCode.toString();
        } else {
          // Если нет message, создаем его
          (ctx as any).message = {
            text: secretCode.toString(),
            message_id: 0,
            date: Math.floor(Date.now() / 1000),
            from: ctx.from,
            chat: ctx.chat
          };
        }
        
        const { joinExistingGroup } = await import('./joinExistingGroup');
        await joinExistingGroup(ctx as any);
        
        // Восстанавливаем оригинальный текст, если был
        if (originalText && ctx.message && 'text' in ctx.message) {
          (ctx.message as any).text = originalText;
        }
        return;
      } else {
        logger.info('START', `Группа с кодом ${secretCode} не найдена`);
        await ctx.reply(`Группа с кодом ${secretCode} не найдена. Проверьте правильность кода.`, getHomeButton());
      }
    }
  }
  
  logger.info('START', `Пользователь ${userId} запустил бота`);
  
  return ctx.reply('Привет! Я "Тайный Дед-Мороз"! 🎅\n\nПеред использованием прочтите инструкцию! 😉', Markup.keyboard([
    ['🆕 Создать группу', '🚪 Присоединиться к группе'],
    ['📋 Мои группы', '📖 Инструкция к боту']
  ]).resize());
}
