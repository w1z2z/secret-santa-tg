/**
 * Утилита для унифицированного логирования
 * Формат: дата/время(мск) [этап/действие] лог
 * Логи пишутся в консоль и в файл logs/YYYY-MM-DD.log
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Получает идентификатор пользователя для логов (username, имя или ID)
 */
export const getUserIdentifier = (from: any): string => {
  if (!from) return 'неизвестный';
  if (from.username) return `@${from.username}`;
  if (from.first_name) return `${from.first_name}${from.last_name ? ' ' + from.last_name : ''}`;
  return `ID:${from.id}`;
};

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

const formatDateForFileName = (): string => {
  const now = new Date();
  const moscowTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
  
  const day = String(moscowTime.getDate()).padStart(2, '0');
  const month = String(moscowTime.getMonth() + 1).padStart(2, '0');
  const year = moscowTime.getFullYear();
  
  return `${year}-${month}-${day}`;
};

const writeToFile = (message: string, error?: any) => {
  try {
    const logsDir = path.join(process.cwd(), 'logs');
    
    // Создаем папку logs если её нет (с обработкой ошибок прав доступа)
    if (!fs.existsSync(logsDir)) {
      try {
        fs.mkdirSync(logsDir, { recursive: true });
      } catch (mkdirErr: any) {
        // Если не удалось создать папку (например, нет прав), просто пропускаем запись в файл
        // Лог уже выведен в консоль, это не критично
        return;
      }
    }
    
    const fileName = `${formatDateForFileName()}.log`;
    const filePath = path.join(logsDir, fileName);
    
    let logEntry = message;
    if (error !== undefined) {
      const errorStr = error instanceof Error ? error.stack || error.toString() : JSON.stringify(error);
      logEntry += `\n${errorStr}`;
    }
    logEntry += '\n';
    
    // Асинхронная запись в файл (неблокирующая)
    fs.appendFile(filePath, logEntry, () => {
      // Тихо игнорируем ошибки записи - лог уже в консоли
    });
  } catch (err) {
    // Игнорируем ошибки записи в файл, чтобы не сломать работу бота
    // Лог уже выведен в консоль
  }
};

export const logger = {
  info: (action: string, message: string, data?: any) => {
    const time = formatMoscowTime();
    const logMessage = `${time} [${action}] ${message}`;
    
    // Вывод в консоль
    if (data !== undefined) {
      console.log(logMessage, data);
      writeToFile(`${logMessage} ${JSON.stringify(data)}`);
    } else {
      console.log(logMessage);
      writeToFile(logMessage);
    }
  },
  
  error: (action: string, message: string, error?: any) => {
    const time = formatMoscowTime();
    const logMessage = `${time} [${action}] ERROR: ${message}`;
    
    // Вывод в консоль
    if (error !== undefined) {
      console.error(logMessage, error);
      writeToFile(logMessage, error);
    } else {
      console.error(logMessage);
      writeToFile(logMessage);
    }
  }
};

