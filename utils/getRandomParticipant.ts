export const getRandomParticipant = (participants: any[]) => {
  if (!participants || participants.length === 0) {
    throw new Error('Массив участников пуст или не определен');
  }
  const randomIndex = Math.floor(Math.random() * participants.length);
  return participants[randomIndex];
}
