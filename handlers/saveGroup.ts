import {Context} from "telegraf";

import {getState, clearState} from "../services";
import {generateRandomCode, getMainMenuKeyboard, logger, getUserIdentifier} from "../utils";
import {Participants, Santa} from "../models";

const santaInfo = (newSantaName: string, participants: string[], selectedPrice: string, secretCode: number, deadline?: string): string => {
  const deadlineText = deadline ? `\nДедлайн: *${deadline}* 📅` : '';

  return `*Тайный Санта 🎅*

*Информация о группе:*
Название: *${newSantaName}* 🎄
Участники: *${participants.join(', ')}* 👥
Цена подарка: *${selectedPrice === "0" ? 'Без ограничений' : 'на ' + selectedPrice + ' руб.'}* 💰${deadlineText}

*Как присоединиться:*
1️⃣ Нажмите на ссылку: [Присоединиться к группе](https://t.me/secret_grandfather_frost_bot?start=${secretCode}) 📩
2️⃣ Или перейдите в бота, нажмите кнопку "Присоединиться к группе" и введите код: \`${secretCode}\` 🔑 (нажмите на код чтобы его скопировать!)

*Важно:*
Перешлите это сообщение вашим друзьям, чтобы они могли принять участие! 🎁

━━━━━━━━━━━━━━━━━━━━
⚠️ *ВНИМАНИЕ СОЗДАТЕЛЮ ГРУППЫ:*
Если вы создатель группы и тоже принимаете участие, вам тоже необходимо присоединиться! 😉
━━━━━━━━━━━━━━━━━━━━
  `;
}

export const saveGroup = async (ctx: any): Promise<void> => {
  const userId = ctx.from?.id;
  
  if (!userId) {
    logger.error('SAVE_GROUP', 'userId не определен');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  const userIdentifier = getUserIdentifier(ctx.from);

  const state = getState(userId);
  
  if (state.currentStep !== 'saveGroup') {
    logger.error('SAVE_GROUP', `Пользователь ${userIdentifier}: Неверный шаг. Ожидался saveGroup, получен: ${state.currentStep}`);
    await ctx.reply('Неверный шаг. Начните заново с команды /start');
    return;
  }

  const selectedPrice = ctx.match?.[0] || state.giftPrice || '0';
  
  logger.info('SAVE_GROUP', `Пользователь ${userIdentifier}: Начало сохранения группы "${state.newSantaName}", участников: ${state.participants?.length}, цена: ${selectedPrice} руб.`);
  
  try {
    // Генерируем уникальный код
    const secretCode: number = await generateRandomCode();
    logger.info('SAVE_GROUP', `Пользователь ${userIdentifier}: Сгенерирован код группы: ${secretCode}`);

    // Парсим дедлайн в Date, если это возможно, иначе оставляем null
    let deadlineDate: Date | null = null;
    
    if (state.deadline) {
      try {
        // Формат из календаря: "15 декабря 2024 г."
        // Пробуем распарсить русский формат
        const monthNames: { [key: string]: number } = {
          'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
          'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
          'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
        };
        
        // Парсим формат "15 декабря 2024 г." или "15 декабря 2024"
        const cleanedDeadline = state.deadline.trim();
        
        // Разбиваем строку по пробелам
        const parts = cleanedDeadline.split(/\s+/);
        
        if (parts.length >= 3) {
          // Формат: ["15", "декабря", "2024", "г."] или ["15", "декабря", "2024"]
          const dayStr = parts[0];
          const monthName = parts[1].toLowerCase().replace(/[.,]/g, ''); // убираем точки и запятые
          const yearStr = parts[2].replace(/[.,г]/g, ''); // убираем точки, запятые и "г"
          
          const day = parseInt(dayStr);
          const year = parseInt(yearStr);
          const month = monthNames[monthName];
          
          if (!isNaN(day) && !isNaN(year) && month !== undefined) {
            deadlineDate = new Date(year, month, day);
            // Устанавливаем время на начало дня
            deadlineDate.setHours(0, 0, 0, 0);
          } else {
            logger.error('SAVE_GROUP', `Пользователь ${userIdentifier}: Ошибка парсинга дедлайна: day=${day}, month=${month}, year=${year}`);
          }
        } else {
          // Пробуем стандартный парсинг
          let parsed = Date.parse(cleanedDeadline);
          if (!isNaN(parsed)) {
            deadlineDate = new Date(parsed);
            deadlineDate.setHours(0, 0, 0, 0);
          } else {
            // Пробуем формат DD.MM.YYYY
            const dotFormatMatch = cleanedDeadline.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (dotFormatMatch) {
              const day = parseInt(dotFormatMatch[1]);
              const month = parseInt(dotFormatMatch[2]) - 1; // месяц с 0
              const year = parseInt(dotFormatMatch[3]);
              deadlineDate = new Date(year, month, day);
              deadlineDate.setHours(0, 0, 0, 0);
            }
          }
        }
      } catch (e) {
        logger.error('SAVE_GROUP', `Пользователь ${userIdentifier}: Ошибка при парсинге даты дедлайна`, e);
        // Оставляем deadlineDate = null, сохраним как есть
      }
    }
    
    const savedSanta = await Santa.create({
      name: state.newSantaName,
      giftPrice: selectedPrice,
      code: secretCode,
      deadline: deadlineDate
    });

    savedSanta.participants = await Promise.all(state.participants.map(async (participant: string) => {
      const newParticipant = await Participants.create({name: participant, santa: savedSanta._id});
      return newParticipant._id;
    }));
    
    await savedSanta.save();

    const messageText = santaInfo(state.newSantaName, state.participants, selectedPrice, secretCode, state.deadline);
    
    // Удаляем предыдущее сообщение с меню (если есть)
    try {
      if (state.lastMenuMessageId && ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, state.lastMenuMessageId);
      }
    } catch (e) {
      // Игнорируем ошибку
    }

    await ctx.reply(messageText, {
      parse_mode: "Markdown"
    });
    
    // Отправляем отдельное сообщение для установки reply keyboard (кнопки над полем ввода)
    await ctx.reply('✨', getMainMenuKeyboard());

      // const imageUrl: string = 'http://qrcoder.ru/code/?t.me%2Fsecret_grandfather_frost_bot&10&0';

      // await ctx.replyWithPhoto(imageUrl, {
      //   caption: 'Так же можете поделиться QR-кодом для доступа к боту',
      // });

    clearState(userId);
  } catch (e) {
    logger.error('SAVE_GROUP', `Пользователь ${userIdentifier}: Ошибка при создании группы`, e);
    try {
      await ctx.reply('Произошла ошибка при создании Деда-Мороза. Попробуйте позже.');
    } catch (replyError) {
      logger.error('SAVE_GROUP', `Пользователь ${userIdentifier}: Не удалось отправить сообщение об ошибке`, replyError);
    }
  }
}
