import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { ICommand } from '../helpers/interface';

export default function(bot: TelegramBot): ICommand {
  return {
    regexp: /\/greet$/,
    name: 'greet',
    help: 'Basic example command for demonstrating purposes',
    usage: '/greet',

    handler: ({msg, matches}) => { // Not necessary to include all parameters
      // You can use messageHelper to parse arguments:

      // import * as messageHelper from '../helpers/message';
      // const args = messageHelper.parseArgs(matches);

      bot.sendMessage(
        msg.chat.id,
        `Wassup ${msg.chat.first_name}!`,
        config.messageOptions, // You can pass messageOptions as a parameter
      );
    },
  };
}