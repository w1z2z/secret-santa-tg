import { Context } from 'telegraf';
import {updateState} from "../services";

export const join = (ctx: Context): void => {
  ctx.reply('Для присоединения к группе введите секретный код "Дед-Мороза" 🎅');
  updateState({ currentStep: 'joinExistingGroup' })
};
