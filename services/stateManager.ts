import {IBotState} from "../interfaces";

let state: IBotState;

export const updateState = (newState: Partial<IBotState>): void => {
  state = { ...state, ...newState };
};

export const getState = (): IBotState => {
  return { ...state };
};

export const initializeState = (initialState: IBotState): void => {
  state = { ...initialState };
};

