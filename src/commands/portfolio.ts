import axios from 'axios';
import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';
import * as storage from '../helpers/portfolio/storage';

export default function(bot: TelegramBot): ICommand {
  return {
    regexp: /^(.+)$/,
    name: 'portfolio',
    help: 'Kryptoportfolio',
    usage: '/greet',

    handler: async ({ msg, matches }) => {
      const args = messageHelper.parseArgs(matches);

      if (args[0] === '/portfolio') {
        return printPortfolio(bot, msg);
      }

      if (msg.chat.type !== 'private') {
        return;
      }

      if (args[0] === '/portfolio') {
        return printMyPortfolio(bot, msg);
      }

      return allCommands(bot, msg, args);
    }
  };
}

function allCommands(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  args: ReadonlyArray<string>
): void {
  const user = storage.getUsers(msg.from.id)[0];

  if (!user) {
    defaultCommand(bot, msg);
    return;
  }

  if (user.askedCrypto) {
    askValue(bot, msg, args[0]);
  } else {
    askCrypto(bot, msg, args[0]);
  }
}

async function defaultCommand(
  bot: TelegramBot,
  msg: TelegramBot.Message
): Promise<void> {
  const user = storage.getUsers(msg.from.id)[0];

  if (!user) {
    await bot.sendMessage(
      msg.from.id,
      `Moro moro ${msg.chat.first_name}! Tehdään kryptoportfolio 🤑`,
      config.messageOptions
    );

    await bot.sendMessage(
      msg.from.id,
      `Kerro mitä kryptoja omistat, kyselen sitten paljonko. Esim.`,
      config.messageOptions
    );

    await bot.sendMessage(msg.from.id, `btc`, config.messageOptions);

    await bot.sendMessage(msg.from.id, `eth`, config.messageOptions);

    storage.addUser(msg.from.id, msg.from.first_name);
  }
}

async function askCrypto(bot, msg, crypto: string): Promise<void> {
  const formattedCrypto = crypto.toUpperCase();

  if (!/^[a-zA-Z0-9]+$/.test(formattedCrypto)) {
    bot.sendMessage(
      msg.from.id,
      `***Virhe:*** Kryptovaluutan nimessä saa olla vain a-z A-Z ja 0-9.
      
Kerro lisää kryptoja tai muokkaa niitä!`,
      config.messageOptions
    );
    return;
  }

  const getCrypto = await axios.get(
    `https://min-api.cryptocompare.com/data/price?fsym=${formattedCrypto}&tsyms=EUR`
  );
  const { data } = getCrypto;

  if (!data.EUR) {
    bot.sendMessage(
      msg.from.id,
      `***Virhe:*** En löytänyt etsimääsi kryptovaluuttaa.
Tarkista että käytit oikeaa lyhennettä.

Kerro lisää kryptoja tai muokkaa niitä!`,
      config.messageOptions
    );
    return;
  }

  storage.askCrypto(msg.from.id, formattedCrypto);

  await bot.sendMessage(
    msg.from.id,
    `Paljonko omistat kryptoa ***${formattedCrypto}***? Esim. \`0.018\`.
Antamalla arvon \`0\` se poistuu.`,
    config.messageOptions
  );
}

async function askValue(bot, msg, value: string): Promise<void> {
  const user = storage.getUsers(msg.from.id)[0];

  if (value === '0') {
    bot.sendMessage(
      msg.from.id,
      `Poistin portfoliostasi krypton ***${user.askedCrypto}***.
Kerro lisää kryptoja tai muokkaa niitä!`,
      config.messageOptions
    );

    storage.removeAskedCrypto(msg.from.id);

    return;
  }

  const floatValue = parseFloat(value);

  if (floatValue <= 0 || isNaN(floatValue) || floatValue > 1000000) {
    bot.sendMessage(
      msg.from.id,
      `***Virhe:*** En ymmärtänyt tarjoamaasi lukua. Kerro paljonko omistat kryptoa \`${
        user.askedCrypto
      }\`.`,
      config.messageOptions
    );

    return;
  }

  storage.addCrypto(msg.from.id, floatValue);

  bot.sendMessage(
    msg.from.id,
    `Lisäsin portfolioosi ***${floatValue} ${user.askedCrypto}***.
Voit muokata tätä kertomalla sen minulle uudestaan. Voit poistaa sen antamalla arvoksi \`0\`.`,
    config.messageOptions
  );
}

function getYesterdaysTimestamp(): number {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return Math.floor(date.valueOf() / 1000);
}

function getTodaysTimestamp(): number {
  const date = new Date();
  return Math.floor(date.valueOf() / 1000);
}

async function printPortfolio(bot, msg): Promise<void> {
  const users = storage.getUsers();
  const cryptos = users.map(user =>
    user.cryptos.map(crypto => crypto.abbreviation)
  );

  const allCryptos = [].concat(...cryptos);
  const joinedCryptos = allCryptos.join(',');

  const yesterdayDate = getYesterdaysTimestamp();
  const apiUrl =
    `https://min-api.cryptocompare.com/data/pricehistorical` +
    `?fsym=EUR&tsyms=${joinedCryptos}&ts=${yesterdayDate}`;
  const getPrice = await axios.get(apiUrl);
  const { data } = getPrice;

  if (!data.EUR) {
    console.log('Data not found');
    return;
  }

  const todayDate = getTodaysTimestamp();

  const apiUrlToday =
    `https://min-api.cryptocompare.com/data/pricehistorical` +
    `?fsym=EUR&tsyms=${joinedCryptos}&ts=${todayDate}`;

  const getTodayPrice = await axios.get(apiUrlToday);
  const todayData = getTodayPrice.data;

  if (!todayData.EUR) {
    console.log('Todays data nto found');
    return;
  }

  const portfolioMessages = users.map(user => {
    const totals = user.cryptos.reduce(
      (acc, crypto) => {
        const yesterdaysCrypto = data.EUR[crypto.abbreviation];
        const todaysCrypto = todayData.EUR[crypto.abbreviation];

        if (yesterdaysCrypto === 0 || todaysCrypto === 0) {
          return acc;
        }

        const yesterdaysCryptoToEur =
          crypto.amount / parseFloat(yesterdaysCrypto);
        const todaysCryptoToEur = crypto.amount / parseFloat(todaysCrypto);

        const yesterdaysTotal = acc.yesterdaysTotal + yesterdaysCryptoToEur;
        const todaysTotal = acc.todaysTotal + todaysCryptoToEur;

        return { yesterdaysTotal, todaysTotal };
      },
      {
        yesterdaysTotal: 0,
        todaysTotal: 0
      }
    );

    const percentChange = totals.todaysTotal / totals.yesterdaysTotal - 1;
    const fixedPercentChange = percentChange.toFixed(5);
    const percentChangeAsFloat = parseFloat(fixedPercentChange) * 100;

    const prefixedChange =
      percentChangeAsFloat > 0
        ? '+' + percentChangeAsFloat
        : percentChangeAsFloat;

    return `***${user.firstName}***: ${prefixedChange}%`;
  });

  const portfolioMessage = portfolioMessages.join('\n');

  bot.sendMessage(msg.chat.id, portfolioMessage, config.messageOptions);
}

function printMyPortfolio(bot: TelegramBot, msg: TelegramBot.Message): void {
  const users = storage.getUsers();
  const currentUser = users.find(user => user.id === msg.from.id);

  if (currentUser) {
    const message = currentUser.cryptos
      .map(crypto => {
        return `***${crypto.abbreviation}:*** ${crypto.amount}`;
      })
      .join('\n');

    bot.sendMessage(msg.from.id, message, config.messageOptions);
  }
}
