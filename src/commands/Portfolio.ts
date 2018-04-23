import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';

export default function(bot: TelegramBot): ICommand {
  return {
    regexp: /^(.+)$/,
    name: 'portfolio',
    help: 'Kryptoportfolio',
    usage: '/greet',

    handler: ({ msg, matches }) => {
      const args = messageHelper.parseArgs(matches);

      console.log(args);

      bot.sendMessage(
        msg.chat.id,
        `Wassup ${msg.chat.first_name}!`,
        config.messageOptions // You can pass messageOptions as a parameter
      );
    }
  };
}
