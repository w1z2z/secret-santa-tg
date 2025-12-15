export interface IBotState {
  currentStep: string;
  newSantaName: string;
  participantsCount: number;
  participants: string[];
  giftPrice?: string;
  deadline?: string;
}
