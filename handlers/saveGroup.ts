import {Context} from "telegraf";

import {getState, clearState} from "../services";
import {generateRandomCode, getMainMenuKeyboard} from "../utils";
import {Participants, Santa} from "../models";

const santaInfo = (newSantaName: string, participants: string[], selectedPrice: string, secretCode: number, deadline?: string): string => {
  const deadlineText = deadline ? `\nДедлайн:* ${deadline}* 📅\n` : '';

  return `
*Тайный Санта 🎅*

Название группы:* ${newSantaName}* 🎄

Участники:* ${participants.join(', ')}* 👥

Цена подарка:* ${selectedPrice === "0" ? 'Без ограничений' : 'до ' + selectedPrice + ' руб.'}* 💰${deadlineText}
Перешлите это сообщение вашим друзьям, чтобы они могли принять участие! 🎁

Всем участникам необходимо присоединиться к группе введя код - *${secretCode}* ‼️

Если вы создатель группы и так же принимаете участие, то вам тоже необходимо присоединиться 😉

\n
Ссылка на бота для приглашения друзей: \n[t.me/secret_grandfather_frost_bot](https://t.me/secret_grandfather_frost_bot) 📩
  `;
}

export const saveGroup = async (ctx: any): Promise<void> => {
  console.log('=== saveGroup ВЫЗВАН ===');
  const userId = ctx.from?.id;
  console.log('userId в saveGroup:', userId);
  
  if (!userId) {
    console.error('Ошибка: userId не определен в saveGroup');
    await ctx.reply('Ошибка: не удалось определить пользователя');
    return;
  }

  console.log('Получение состояния для userId:', userId);
  const state = getState(userId);
  console.log('Состояние получено:', JSON.stringify(state, null, 2));
  console.log('currentStep:', state.currentStep);
  
  if (state.currentStep !== 'saveGroup') {
    console.error('ОШИБКА: неверный шаг. Ожидался saveGroup, получен:', state.currentStep);
    await ctx.reply('Неверный шаг. Начните заново с команды /start');
    return;
  }

  const selectedPrice = ctx.match?.[0] || state.giftPrice || '0';
  console.log('selectedPrice:', selectedPrice);
  console.log('ctx.match:', ctx.match);
  console.log('state.giftPrice:', state.giftPrice);
  
  console.log('Данные для сохранения в БД:', {
    name: state.newSantaName,
    participantsCount: state.participants?.length,
    participants: state.participants,
    giftPrice: selectedPrice,
    deadline: state.deadline
  });
  
  try {
    console.log('Начало try блока в saveGroup');
    // Генерируем уникальный код
    console.log('Генерация уникального кода...');
    const secretCode: number = await generateRandomCode();
    console.log('Сгенерирован код:', secretCode);

    // Парсим дедлайн в Date, если это возможно, иначе оставляем null
    console.log('Парсинг дедлайна. state.deadline:', state.deadline);
    let deadlineDate: Date | null = null;
    if (state.deadline) {
      try {
        console.log('Попытка парсинга дедлайна:', state.deadline);
        // Формат из календаря: "15 декабря 2024 г."
        // Пробуем распарсить русский формат
        const monthNames: { [key: string]: number } = {
          'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
          'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
          'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
        };
        
        // Парсим формат "15 декабря 2024 г." или "15 декабря 2024"
        const ruFormatMatch = state.deadline.match(/(\d{1,2})\s+(\w+)\s+(\d{4})(?:\s+г\.?)?/);
        console.log('ruFormatMatch:', ruFormatMatch);
        if (ruFormatMatch) {
          const day = parseInt(ruFormatMatch[1]);
          const monthName = ruFormatMatch[2];
          const year = parseInt(ruFormatMatch[3]);
          const month = monthNames[monthName];
          console.log(`Парсинг: day=${day}, monthName=${monthName}, month=${month}, year=${year}`);
          
          if (month !== undefined) {
            deadlineDate = new Date(year, month, day);
            console.log('deadlineDate создан (русский формат):', deadlineDate);
          } else {
            console.error('Неизвестное название месяца:', monthName);
          }
        } else {
          // Пробуем стандартный парсинг
          console.log('Попытка стандартного парсинга');
          let parsed = Date.parse(state.deadline);
          if (!isNaN(parsed)) {
            deadlineDate = new Date(parsed);
            console.log('deadlineDate создан (стандартный парсинг):', deadlineDate);
          } else {
            // Пробуем формат DD.MM.YYYY
            console.log('Попытка парсинга формата DD.MM.YYYY');
            const dotFormatMatch = state.deadline.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
            if (dotFormatMatch) {
              const day = parseInt(dotFormatMatch[1]);
              const month = parseInt(dotFormatMatch[2]) - 1; // месяц с 0
              const year = parseInt(dotFormatMatch[3]);
              deadlineDate = new Date(year, month, day);
              console.log('deadlineDate создан (DD.MM.YYYY):', deadlineDate);
            } else {
              console.error('Не удалось распарсить дедлайн в любом формате');
            }
          }
        }
      } catch (e) {
        console.error('Ошибка при парсинге даты дедлайна:', e);
        // Оставляем deadlineDate = null, сохраним как есть
      }
    } else {
      console.log('Дедлайн не указан');
    }
    console.log('Итоговый deadlineDate:', deadlineDate);

    console.log('Создание Santa в БД...');
    console.log('Данные для сохранения Santa:', {
      name: state.newSantaName,
      giftPrice: selectedPrice,
      code: secretCode,
      deadline: deadlineDate,
      deadlineType: typeof deadlineDate,
      deadlineIsValid: deadlineDate instanceof Date ? 'valid Date' : 'not a Date'
    });
    
    const savedSanta = await Santa.create({
      name: state.newSantaName,
      giftPrice: selectedPrice,
      code: secretCode,
      deadline: deadlineDate
    });
    console.log('Santa создан, _id:', savedSanta._id);
    console.log('Сохраненный deadline в БД:', savedSanta.deadline);

    console.log('Создание участников, количество:', state.participants?.length);
    savedSanta.participants = await Promise.all(state.participants.map(async (participant: string) => {
      console.log('Создание участника:', participant);
      const newParticipant = await Participants.create({name: participant, santa: savedSanta._id});
      console.log('Участник создан, _id:', newParticipant._id);
      return newParticipant._id;
    }));
    console.log('Все участники созданы');
    
    console.log('Сохранение Santa с участниками...');
    await savedSanta.save();
    console.log('Santa сохранен');

    console.log('Формирование сообщения для отправки...');
    const messageText = santaInfo(state.newSantaName, state.participants, selectedPrice, secretCode, state.deadline);
    console.log('Текст сообщения подготовлен, длина:', messageText.length);
    
    console.log('Отправка сообщения пользователю...');
    await ctx.reply(messageText, {
      parse_mode: "Markdown",
      ...getMainMenuKeyboard()
    });
    console.log('Сообщение отправлено');

      // const imageUrl: string = 'http://qrcoder.ru/code/?t.me%2Fsecret_grandfather_frost_bot&10&0';

      // await ctx.replyWithPhoto(imageUrl, {
      //   caption: 'Так же можете поделиться QR-кодом для доступа к боту',
      // });

    console.log('Очистка состояния...');
    clearState(userId);
    console.log('Группа успешно создана, код:', secretCode);
    console.log('=== saveGroup ЗАВЕРШЕН УСПЕШНО ===');
  } catch (e) {
    console.error('=== ОШИБКА В saveGroup ===');
    console.error('Произошла ошибка при создании группы:', e);
    if (e instanceof Error) {
      console.error('Тип ошибки:', e.constructor.name);
      console.error('Сообщение ошибки:', e.message);
      console.error('Стек ошибки:', e.stack);
    }
    try {
      await ctx.reply('Произошла ошибка при создании Деда-Мороза. Попробуйте позже.');
      console.log('Сообщение об ошибке отправлено пользователю');
    } catch (replyError) {
      console.error('Не удалось отправить сообщение об ошибке:', replyError);
    }
  }
}
