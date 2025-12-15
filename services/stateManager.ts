import {IBotState} from "../interfaces";

// Хранилище состояний по userId
const userStates = new Map<number, IBotState>();

const getDefaultState = (): IBotState => ({
  currentStep: 'newSanta',
  newSantaName: '',
  participantsCount: 0,
  participants: [],
});

export const updateState = (userId: number, newState: Partial<IBotState>): void => {
  const currentState = userStates.get(userId) || getDefaultState();
  userStates.set(userId, { ...currentState, ...newState });
};

export const getState = (userId: number): IBotState => {
  return userStates.get(userId) || getDefaultState();
};

export const clearState = (userId: number): void => {
  userStates.set(userId, getDefaultState());
};

export const initializeState = (userId: number, initialState?: Partial<IBotState>): void => {
  userStates.set(userId, { ...getDefaultState(), ...initialState });
};
