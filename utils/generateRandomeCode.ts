import {Santa} from "../models";

export const generateRandomCode = async (): Promise<number> => {
  let code: number;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 100;

  // Генерируем код до тех пор, пока не найдем уникальный (максимум 100 попыток)
  while (!isUnique && attempts < maxAttempts) {
    code = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000;
    const existingSanta = await Santa.findOne({ code });
    
    if (!existingSanta) {
      isUnique = true;
      return code!;
    }
    
    attempts++;
  }

  // Если за 100 попыток не нашли уникальный код (крайне маловероятно)
  throw new Error('Не удалось сгенерировать уникальный код. Попробуйте позже.');
}
