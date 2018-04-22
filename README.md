# Tuplabotti

Easily expandable and modifiable Typescript Telegram bot. Works on top of [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api).

## Features

* Greets you!
  * `/greet`
* Gives a list of commands
  * `/help`
* Easy to add new commands

Type /help for list of commands

## Installation and usage

1.  Clone the repository
2.  `npm install`
3.  Add your Telegram token to config.ts
4.  `npm start`

## Developing

### Adding commands

Commands are supposed to be added to `./commands/` as _.ts_ files. You can use `Greeter.ts` as an example of a ICommand function.

When you have finished creating your command, you can add it to `./command.ts` to `getCommand()` function, which returns a list that Tuplabotti iterates through when starting to listen for messages.

### Adding startup tasks

Append the list in `./command.ts`'s `getStartupTasks()` with your function which returns a `Promise`.
