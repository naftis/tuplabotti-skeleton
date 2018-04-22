import * as TelegramBot from 'node-telegram-bot-api';
import { getCommands, getStartupTasks } from './command';
import { config } from './config';
import { errorHandling } from './helpers/message';

errorHandling('Bot started');

const bot: TelegramBot = new TelegramBot(config.telegramToken, {
  polling: true
});

getStartupTasks(bot);

for (const command of getCommands(bot)) {
  bot.onText(command.regexp, (msg, matches) => {
    command.handler({ msg, matches });
  });
}

bot.on('polling_error', errorHandling);
bot.on('webhook_error', errorHandling);
