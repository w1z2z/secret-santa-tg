import {Context} from "telegraf";

export interface ICustomContext extends Context {
  customMatch?: {
    input: string;
    [key: number]: string;
  };
  customFrom?: {
    id: number;
    [key: string]: any;
  };
  customMessage?: {
    text: string;
    [key: string]: any;
  };
}
