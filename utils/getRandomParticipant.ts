export const getRandomParticipant = (participants: any[]) => {
  const randomIndex = Math.floor(Math.random() * participants.length);
  return participants[randomIndex];
}
