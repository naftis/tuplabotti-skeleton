import { Message } from 'node-telegram-bot-api';

interface HandlerData {
  readonly msg: Message;
  readonly matches: RegExpExecArray | null;
}

interface HandlerFunc {
  (data: HandlerData): void;
}

export interface ICommand {
  readonly regexp: RegExp;
  readonly name: string;
  readonly help: string;
  readonly usage: string;

  readonly handler: HandlerFunc;
}
