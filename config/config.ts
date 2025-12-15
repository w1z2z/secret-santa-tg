import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

// Формирование MONGO_URI с аутентификацией
const getMongoUri = (): string => {
  const username = process.env.MONGO_USERNAME;
  const password = process.env.MONGO_PASSWORD;
  const host = process.env.MONGO_HOST || 'localhost';
  const port = process.env.MONGO_PORT || '27017';
  const database = process.env.MONGO_DATABASE || 'secret-santa';

  // Если указан явный MONGO_URI, используем его
  if (process.env.MONGO_URI) {
    return process.env.MONGO_URI;
  }

  // Если есть username и password, формируем URI с аутентификацией
  if (username && password) {
    return `mongodb://${username}:${password}@${host}:${port}/${database}?authSource=admin`;
  }

  // Иначе без аутентификации
  return `mongodb://${host}:${port}/${database}`;
};

const config:{MONGO_URI: string, TG_TOKEN: string} = {
  TG_TOKEN: process.env.TG_TOKEN || '',
  MONGO_URI: getMongoUri()
};

export default config;
