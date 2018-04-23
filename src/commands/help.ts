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

      bot.sendMessage(msg.chat.id, helpText, config.messageOptions);
    }
  };
}

function handleArguments(
  bot: TelegramBot,
  args: ReadonlyArray<string>
): string {
  const allCommands = getCommands(bot);

  if (args.length === 0) {
    const availableCommands = allCommands
      .map(command => `${command.usage}\n_${command.help}_`)
      .join('\n\n');

    return `*The following commands are available:*\n${availableCommands}`;
  }

  const foundCommand = allCommands.find(cmd => cmd.name === args[0]);

  if (foundCommand) {
    return `${foundCommand.usage}\n_${foundCommand.help}_`;
  }

  return `Command not found.\nPlease refer to /help`;
}
