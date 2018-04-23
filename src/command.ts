import * as TelegramBot from 'node-telegram-bot-api';
import greeter from './commands/greeter';
import help from './commands/help';
import portfolio from './commands/portfolio';
import { ICommand } from './helpers/interface';

// Commands
export function getCommands(bot: TelegramBot): ReadonlyArray<ICommand> {
  return [greeter(bot), help(bot), portfolio(bot)];
}

// Promises executed while starting the bot
export function getStartupTasks(
  bot: TelegramBot
): ReadonlyArray<number | NodeJS.Timer> {
  return [];
}
