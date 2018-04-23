import * as TelegramBot from 'node-telegram-bot-api';
import { getCommands } from '../command';
import { config } from '../config';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';

export default function(bot: TelegramBot): ICommand {
  return {
    regexp: /\/help[ ]?(.*)$/,
    name: 'help',
    help: 'Displays a list of all available commands.',
    usage: `/help\n` + `/help <command>`,

    handler: ({ msg, matches }) => {
      const args = messageHelper.parseArgs(matches);
      const helpText = handleArguments(bot, args);

      if (helpText) {
        bot.sendMessage(msg.chat.id, helpText, config.messageOptions);
      }
    }
  };
}

function handleArguments(
  bot: TelegramBot,
  args: ReadonlyArray<string>
): string | void {
  if (args.length === 0) {
    const availableCommands = getCommands(bot)
      .map(command => {
        return `${command.usage}\n_${command.help}_`;
      })
      .join('\n\n');

    return `*The following commands are available:*\n${availableCommands}`;
  }

  if (args.length === 1) {
    const command = getCommands(bot).find(cmd => cmd.name === args[0]);

    if (command) {
      return `${command.usage}\n_${command.help}_`;
    } else {
      return `Command not found.\nPlease refer to /help`;
    }
  }

  return;
}
