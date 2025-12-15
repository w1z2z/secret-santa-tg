import {Context} from "telegraf";
import {updateState, getState} from "../services";

export const handleCalendar = async (ctx: any): Promise<void> => {
  console.log('=== handleCalendar вызван ===');
  const userId = ctx.from?.id;
  console.log('userId:', userId);
  
  if (!userId) {
    console.error('Ошибка: userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  // Получаем callback data правильно - используем match.input как в других обработчиках
  const callbackData = ctx.match?.input || ctx.callbackQuery?.data || ctx.match?.[0] || '';
  console.log('callbackData:', callbackData);
  console.log('ctx.match:', ctx.match);
  console.log('ctx.match.input:', ctx.match?.input);
  console.log('ctx.callbackQuery?.data:', ctx.callbackQuery?.data);
  
  // Обработка выбора даты
  if (callbackData.startsWith('cal_date_')) {
    console.log('Обработка выбора даты');
    
    const parts = callbackData.split('_');
    console.log('parts:', parts);
    
    const year = parseInt(parts[2]);
    const month = parseInt(parts[3]);
    const day = parseInt(parts[4]);
    console.log(`Парсинг даты: year=${year}, month=${month}, day=${day}`);
    
    const selectedDate = new Date(year, month, day);
    console.log('selectedDate:', selectedDate);
    
    const formattedDate = selectedDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    console.log('formattedDate:', formattedDate);
    
    // Получаем текущее состояние
    console.log('Получение состояния для userId:', userId);
    const currentState = getState(userId);
    console.log('currentState:', JSON.stringify(currentState, null, 2));
    
    if (!currentState.giftPrice) {
      console.error('Ошибка: giftPrice не найдена в состоянии');
      await ctx.answerCbQuery('Ошибка: не найдена цена подарка');
      return;
    }

    console.log('Обновление состояния с deadline и currentStep');
    // Сохраняем дату и переходим к сохранению группы
    updateState(userId, { 
      deadline: formattedDate, 
      currentStep: 'saveGroup' 
    });
    console.log('Состояние обновлено');
    
    console.log('Отправка answerCbQuery');
    await ctx.answerCbQuery(`✅ Выбрана дата: ${day} декабря`);
    console.log('answerCbQuery отправлен');
    
    // Удаляем сообщение с календарем после ответа на callback
    try {
      console.log('Попытка удалить сообщение с календарем');
      await ctx.deleteMessage();
      console.log('Сообщение удалено');
    } catch (e) {
      console.log('Не удалось удалить сообщение с календарем:', e);
    }
    
    try {
      console.log('=== НАЧАЛО СОХРАНЕНИЯ ГРУППЫ ===');
      console.log('Данные для сохранения:', {
        userId,
        giftPrice: currentState.giftPrice,
        deadline: formattedDate,
        participantsCount: currentState.participants?.length,
        newSantaName: currentState.newSantaName,
        participants: currentState.participants
      });
      
      // Передаем ctx напрямую, saveGroup использует state.giftPrice как fallback
      console.log('Импорт saveGroup');
      const { saveGroup } = await import('./saveGroup');
      console.log('saveGroup импортирован');
      
      // Устанавливаем match для совместимости
      ctx.match = [currentState.giftPrice];
      console.log('ctx.match установлен:', ctx.match);
      
      console.log('Вызов saveGroup...');
      await saveGroup(ctx);
      console.log('saveGroup завершен успешно');
    } catch (error) {
      console.error('=== ОШИБКА ПРИ СОХРАНЕНИИ ГРУППЫ ===');
      console.error('Ошибка при сохранении группы из календаря:', error);
      if (error instanceof Error) {
        console.error('Тип ошибки:', error.constructor.name);
        console.error('Сообщение ошибки:', error.message);
        console.error('Стек ошибки:', error.stack);
      }
      try {
        await ctx.reply('Произошла ошибка при создании группы. Попробуйте позже.');
        console.log('Сообщение об ошибке отправлено пользователю');
      } catch (replyError) {
        console.error('Не удалось отправить сообщение об ошибке:', replyError);
      }
    }
    console.log('=== handleCalendar завершен ===');
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

