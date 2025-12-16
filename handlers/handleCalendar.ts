import {Context} from "telegraf";
import {updateState, getState} from "../services";
import {logger} from "../utils";

export const handleCalendar = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    logger.error('HANDLE_CALENDAR', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  // Получаем callback data правильно - используем match.input как в других обработчиках
  const callbackData = ctx.match?.input || ctx.callbackQuery?.data || ctx.match?.[0] || '';
  logger.info('HANDLE_CALENDAR', `Пользователь ${userId}, callback: ${callbackData}`);
  
  // Обработка выбора даты
  if (callbackData.startsWith('cal_date_')) {
    const parts = callbackData.split('_');
    const year = parseInt(parts[2]);
    const month = parseInt(parts[3]);
    const day = parseInt(parts[4]);
    
    const selectedDate = new Date(year, month, day);
    const formattedDate = selectedDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const currentState = getState(userId);
    
    if (!currentState.giftPrice) {
      logger.error('HANDLE_CALENDAR', 'giftPrice не найдена в состоянии');
      await ctx.answerCbQuery('Ошибка: не найдена цена подарка');
      return;
    }

    logger.info('HANDLE_CALENDAR', `Выбрана дата: ${formattedDate}, группа: "${currentState.newSantaName}"`);
    
    // Сохраняем дату и переходим к сохранению группы
    updateState(userId, { 
      deadline: formattedDate, 
      currentStep: 'saveGroup' 
    });
    
    await ctx.answerCbQuery(`✅ Выбрана дата: ${day} декабря`);
    
    // Удаляем сообщение с календарем после ответа на callback
    try {
      await ctx.deleteMessage();
    } catch (e) {
      logger.error('HANDLE_CALENDAR', 'Не удалось удалить сообщение с календарем', e);
    }
    
    try {
      const { saveGroup } = await import('./saveGroup');
      ctx.match = [currentState.giftPrice];
      await saveGroup(ctx);
    } catch (error) {
      logger.error('HANDLE_CALENDAR', 'Ошибка при сохранении группы', error);
      try {
        await ctx.reply('Произошла ошибка при создании группы. Попробуйте позже.');
      } catch (replyError) {
        logger.error('HANDLE_CALENDAR', 'Не удалось отправить сообщение об ошибке', replyError);
      }
    }
    return;
  }

  // Обработка пустых кнопок, заголовков и прошлых дат
  if (callbackData === 'cal_empty' || callbackData === 'cal_header') {
    await ctx.answerCbQuery();
    return;
  }

  if (callbackData === 'cal_past') {
    await ctx.answerCbQuery('Нельзя выбрать прошедшую дату', { show_alert: true });
    return;
  }
};

