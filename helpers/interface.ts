import { Message } from 'node-telegram-bot-api';

export interface ICommand {
  regexp: RegExp;
  name: string;
  help: string;
  usage: string;

  handler: (data: {msg: Message, matches: RegExpExecArray | null}) => void;
}