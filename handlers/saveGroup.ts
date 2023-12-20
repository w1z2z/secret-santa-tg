import {Context} from "telegraf";

import {getState, updateState} from "../services";
import {generateRandomCode} from "../utils";
import {Participants, Santa} from "../models";
import {IBotState} from "../interfaces";

const santaInfo = (newSantaName: string, participants: string[], selectedPrice: string, secretCode: number): string => {
  return `
*Тайный Санта 🎅*

Название группы:* ${newSantaName}* 🎄

Участники:* ${participants.join(', ')}* 👥

Цена подарка:* ${selectedPrice === "0" ? 'Без ограничений' : 'до ' + selectedPrice + ' руб.'}* 💰

Перешлите это сообщение вашим друзьям, чтобы они могли принять участие! 🎁

Всем участникам необходимо присоединиться к группе введя код - *${secretCode}*‼️

Если вы создатель группы и так же принимаете участие, то вам тоже необходимо присоединиться😉

\n
Ссылка на бота для приглашения друзей: \n[t.me/secret_grandfather_frost_bot](https://t.me/secret_grandfather_frost_bot) 📩
  `;
}

export const saveGroup = async (ctx: any): Promise<void> => {
  if (getState().currentStep === 'saveGroup') {
    const selectedPrice = ctx.match[0];
    const secretCode: number = generateRandomCode();
    const state: IBotState = getState();

    try {
      const savedSanta = await Santa.create({
        name: getState().newSantaName,
        giftPrice: selectedPrice,
        code: secretCode
      });

      savedSanta.participants = await Promise.all(state.participants.map(async (participant: string) => {
        const newParticipant= await Participants.create({name: participant, santa: savedSanta._id});
        return newParticipant._id;
      }));
      await savedSanta.save();

      ctx.reply(santaInfo(state.newSantaName, state.participants, selectedPrice, secretCode), {parse_mode: "Markdown"});

      // const imageUrl: string = 'http://qrcoder.ru/code/?t.me%2Fsecret_grandfather_frost_bot&10&0';

      // await ctx.replyWithPhoto(imageUrl, {
      //   caption: 'Так же можете поделиться QR-кодом для доступа к боту',
      // });


      updateState({
        currentStep: 'newSanta',
        newSantaName: '',
        participantsCount: 0,
        participants: [],
      })
    } catch (e) {
      console.error('Произошла ошибка при создании группы:', e);
      ctx.reply('Произошла ошибка при создании Деда-Мороза');
    }
  }
}
