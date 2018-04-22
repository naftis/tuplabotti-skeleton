require('dotenv').config();

/*
 * For commands,
 * refer to command.ts
 */

export const config = {
  /*
   * Telegram bot token : string
   *  Can be acquired from BotFather
   */
  telegramToken: process.env.TELEGRAM_TOKEN,

  /*
   * Message options : object
   *  https://core.telegram.org/bots/api#sendmessage
   */
  messageOptions: {
    parse_mode: 'Markdown'
  },

  /*
   * console.log style where %s is the message
   */
  consoleStyle: '\x1b[1mconsole.log.tuplabotti:\x1b[0m %s'
};
