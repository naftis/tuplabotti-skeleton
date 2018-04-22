import * as TelegramBot from 'node-telegram-bot-api';
import Greeter from './commands/Greeter';
import Help from './commands/Help';
import { ICommand } from './helpers/interface';

// Commands
export function getCommands(bot: TelegramBot): ICommand[] {
  return [Greeter(bot), Help(bot)];
}

// Promises executed while starting the bot
export function getStartupTasks(
  bot: TelegramBot
): Array<number | NodeJS.Timer> {
  return [];
}
