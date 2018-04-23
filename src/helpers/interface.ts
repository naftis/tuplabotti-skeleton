import { Message } from 'node-telegram-bot-api';

export interface ICommand {
  readonly regexp: RegExp;
  readonly name: string;
  readonly help: string;
  readonly usage: string;

  handler: (data: { msg: Message; matches: RegExpExecArray | null }) => void;
}
