/**
 * Утилита для унифицированного логирования
 * Формат: дата/время(мск) [этап/действие] лог
 */

const formatMoscowTime = (): string => {
  const now = new Date();
  const moscowTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  
  const day = String(moscowTime.getDate()).padStart(2, '0');
  const month = String(moscowTime.getMonth() + 1).padStart(2, '0');
  const year = moscowTime.getFullYear();
  const hours = String(moscowTime.getHours()).padStart(2, '0');
  const minutes = String(moscowTime.getMinutes()).padStart(2, '0');
  const seconds = String(moscowTime.getSeconds()).padStart(2, '0');
  
  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}(мск)`;
};

export const logger = {
  info: (action: string, message: string, data?: any) => {
    const time = formatMoscowTime();
    const logMessage = `${time} [${action}] ${message}`;
    if (data !== undefined) {
      console.log(logMessage, data);
    } else {
      console.log(logMessage);
    }
  },
  
  error: (action: string, message: string, error?: any) => {
    const time = formatMoscowTime();
    const logMessage = `${time} [${action}] ERROR: ${message}`;
    if (error !== undefined) {
      console.error(logMessage, error);
    } else {
      console.error(logMessage);
    }
  }
};

