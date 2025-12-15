import {Markup} from "telegraf";

export const generateDecemberCalendar = () => {
  const buttons: any[][] = [];
  
  // Заголовок
  buttons.push([
    Markup.button.callback('📅 Выберите дату в декабре', 'cal_header')
  ]);

  // Дни недели
  buttons.push([
    Markup.button.callback('Пн', 'cal_header'),
    Markup.button.callback('Вт', 'cal_header'),
    Markup.button.callback('Ср', 'cal_header'),
    Markup.button.callback('Чт', 'cal_header'),
    Markup.button.callback('Пт', 'cal_header'),
    Markup.button.callback('Сб', 'cal_header'),
    Markup.button.callback('Вс', 'cal_header')
  ]);

  // Декабрь 2024 начинается с воскресенья (1 декабря = воскресенье)
  // Но лучше использовать текущий год
  const currentYear = new Date().getFullYear();
  const decemberStart = new Date(currentYear, 11, 1); // 11 = декабрь (0-indexed)
  const firstDayOfWeek = decemberStart.getDay();
  const adjustedFirstDay = firstDayOfWeek === 0 ? 7 : firstDayOfWeek; // Понедельник = 1
  
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const isDecember = todayMonth === 11;

  let day = 1;
  let week: any[] = [];

  // Пустые ячейки до первого дня декабря
  for (let i = 1; i < adjustedFirstDay; i++) {
    week.push(Markup.button.callback(' ', 'cal_empty'));
  }

  // Дни декабря (1-31)
  while (day <= 31) {
    // День недоступен, если мы в декабре и день <= сегодняшней даты (включительно)
    const isUnavailable = isDecember && day <= todayDate;
    const isToday = isDecember && day === todayDate;
    
    // Определяем день недели для текущей даты
    const currentDate = new Date(currentYear, 11, day);
    const dayOfWeek = currentDate.getDay(); // 0 = воскресенье, 6 = суббота
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Воскресенье или суббота
    
    let dayText = String(day);
    
    // Визуальное оформление дней
    if (isUnavailable) {
      // Недоступные дни - зачеркнутые
      dayText = `❌`;
    } else if (isToday) {
      // Сегодняшний день (если доступен) - в скобках
      dayText = `[${day}]`;
    }
    
    // Все дни показываются, но недоступные имеют callback 'cal_past'
    const callbackData = isUnavailable ? 'cal_past' : `cal_date_${currentYear}_11_${day}`;
    
    week.push(Markup.button.callback(dayText, callbackData));
    
    if (week.length === 7) {
      buttons.push(week);
      week = [];
    }
    
    day++;
  }

  // Пустые ячейки до конца недели
  while (week.length < 7 && week.length > 0) {
    week.push(Markup.button.callback(' ', 'cal_empty'));
  }
  
  if (week.length > 0) {
    buttons.push(week);
  }

  return Markup.inlineKeyboard(buttons);
};

export const getCurrentMonthCalendar = () => {
  return generateDecemberCalendar();
};
