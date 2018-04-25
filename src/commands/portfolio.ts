import axios from 'axios';
import * as TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';
import { ICommand } from '../helpers/interface';
import * as messageHelper from '../helpers/message';
import * as storage from '../helpers/portfolio/storage';

export default function(bot: TelegramBot): ICommand {
  return {
    regexp: /^([a-zA-Z0-9\.]+|\/portfolio)$/,
    name: 'portfolio',
    help: 'Kryptoportfolio',
    usage: '/portfolio',

    handler: async ({ msg, matches }) => {
      const args = messageHelper.parseArgs(matches);

      const isPortfolioMsg = args[0] === '/portfolio';
      const isPrivateChat = msg.chat.type === 'private';

      if (!isPortfolioMsg) {
        return allCommands(bot, msg, args);
      }

      if (isPrivateChat) {
        printUserPortfolio(bot, msg);
      }

      return printGroupPortfolio(bot, msg);
    }
  };
}

function allCommands(
  bot: TelegramBot,
  msg: TelegramBot.Message,
  args: ReadonlyArray<string>
): Promise<TelegramBot.Message | Error> {
  const user = storage.getUsers(msg.from.id)[0];

  if (!user) {
    return askCryptoAbbreviations(bot, msg);
  }

  if (user.askedCrypto) {
    return modifyValueInStorage(bot, msg, args[0]);
  } else {
    return askCryptoValues(bot, msg, args[0]);
  }
}

async function askCryptoAbbreviations(
  bot: TelegramBot,
  msg: TelegramBot.Message
): Promise<TelegramBot.Message | Error> {
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

  storage.addUser(msg.from.id, msg.from.first_name);

  await bot.sendMessage(msg.from.id, `btc`, config.messageOptions);
  return bot.sendMessage(msg.from.id, `eth`, config.messageOptions);
}

async function askCryptoValues(
  bot,
  msg,
  crypto: string
): Promise<TelegramBot.Message | Error> {
  const formattedCrypto = crypto.toUpperCase();

  if (!/^[a-zA-Z0-9]+$/.test(formattedCrypto)) {
    return bot.sendMessage(
      msg.from.id,
      `***Virhe:*** Kryptovaluutan nimessä saa olla vain a-z A-Z ja 0-9.\n` +
        `Kerro lisää kryptoja tai muokkaa niitä!`,
      config.messageOptions
    );
  }

  const getCrypto = await axios.get(
    `https://min-api.cryptocompare.com/data/price?fsym=${formattedCrypto}&tsyms=EUR`
  );
  const { data } = getCrypto;

  if (!data.EUR) {
    return bot.sendMessage(
      msg.from.id,
      `***Virhe:*** En löytänyt etsimääsi kryptovaluuttaa.\n` +
        `Tarkista että käytit oikeaa lyhennettä.\n\n` +
        `Kerro lisää kryptoja tai muokkaa niitä!`,
      config.messageOptions
    );
  }

  storage.askCrypto(msg.from.id, formattedCrypto);

  return bot.sendMessage(
    msg.from.id,
    `Paljonko omistat kryptoa ***${formattedCrypto}***? Esim. \`0.018\`.\n` +
      `Antamalla arvon \`0\` se poistuu.`,
    config.messageOptions
  );
}

async function modifyValueInStorage(
  bot,
  msg,
  value: string
): Promise<TelegramBot.Message | Error> {
  const user = storage.getUsers(msg.from.id)[0];

  if (value === '0') {
    storage.removeAskedCrypto(msg.from.id);

    return bot.sendMessage(
      msg.from.id,
      `Poistin portfoliostasi krypton ***${user.askedCrypto}***.\n` +
        `Kerro lisää kryptoja tai muokkaa niitä!`,
      config.messageOptions
    );
  }

  const floatValue = parseFloat(value);

  if (floatValue <= 0 || isNaN(floatValue) || floatValue > 1000000) {
    return bot.sendMessage(
      msg.from.id,
      `***Virhe:*** En ymmärtänyt tarjoamaasi lukua.\n` +
        `Kerro paljonko omistat kryptoa \`${user.askedCrypto}\`.`,
      config.messageOptions
    );
  }

  storage.addCrypto(msg.from.id, floatValue);

  return bot.sendMessage(
    msg.from.id,
    `Lisäsin portfolioosi ***${floatValue} ${user.askedCrypto}***.\n` +
      `Voit muokata tätä kertomalla sen minulle uudestaan.\n` +
      `Voit poistaa sen antamalla arvoksi \`0\`.`,
    config.messageOptions
  );
}

function getYesterdaysTimestamp(): number {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return Math.floor(date.valueOf() / 1000);
}

function getCurrentTimestamp(): number {
  const date = new Date();
  return Math.floor(date.valueOf() / 1000);
}

async function printGroupPortfolio(
  bot,
  msg
): Promise<TelegramBot.Message | Error> {
  const users = storage.getUsers();
  const cryptos = users.map(user =>
    user.cryptos.map(crypto => crypto.abbreviation)
  );

  const allUsersCryptoAbbrs = [].concat(...cryptos);
  const joinedCryptoAbbrs = allUsersCryptoAbbrs.join(',');

  const pastTimestamp = getYesterdaysTimestamp();
  const currentTimestamp = getCurrentTimestamp();

  const apiUrlPast =
    `https://min-api.cryptocompare.com/data/pricehistorical` +
    `?fsym=EUR&tsyms=${joinedCryptoAbbrs}&ts=${pastTimestamp}`;
  const apiUrlCurrent =
    `https://min-api.cryptocompare.com/data/pricehistorical` +
    `?fsym=EUR&tsyms=${joinedCryptoAbbrs}&ts=${currentTimestamp}`;

  const getPastPrice = await axios.get(apiUrlPast);
  const pastData = getPastPrice.data;

  if (!pastData.EUR) {
    console.log('Yesterdays data not found');
    return;
  }

  const getCurrentPrice = await axios.get(apiUrlCurrent);
  const currentData = getCurrentPrice.data;

  if (!currentData.EUR) {
    console.log('Todays data not found');
    return;
  }

  const portfolioMessages = users.map(user => {
    const { currentTotal, pastTotal } = getPastAndCurrentTotalInEur(
      user.cryptos,
      pastData,
      currentData
    );

    const percentChange = currentTotal / pastTotal - 1;
    const fixedPercentChange = percentChange.toFixed(5);
    const percentChangeAsFloat = parseFloat(fixedPercentChange) * 100;

    const prefixedChange =
      percentChangeAsFloat > 0
        ? '+' + percentChangeAsFloat
        : percentChangeAsFloat;

    return `***${user.firstName}***: ${prefixedChange}%`;
  });

  const portfolioMessage = portfolioMessages.join('\n');

  return bot.sendMessage(msg.chat.id, portfolioMessage, config.messageOptions);
}

interface ApiResponse {
  readonly EUR: object;
}

interface PastAndCurrentTotal {
  readonly pastTotal: number;
  readonly currentTotal: number;
}

function getPastAndCurrentTotalInEur(
  cryptos: ReadonlyArray<storage.Crypto>,
  pastEurToCrypto: ApiResponse,
  currentEurToCrypto: ApiResponse
): PastAndCurrentTotal {
  return cryptos.reduce(
    (acc, crypto) => {
      const pastCrypto = pastEurToCrypto.EUR[crypto.abbreviation];
      const currentCrypto = currentEurToCrypto.EUR[crypto.abbreviation];

      if (pastCrypto === 0 || currentCrypto === 0) {
        return acc;
      }

      const pastCryptoToEur = crypto.amount / parseFloat(pastCrypto);
      const currentCryptoToEur = crypto.amount / parseFloat(currentCrypto);

      const pastTotal = acc.pastTotal + pastCryptoToEur;
      const currentTotal = acc.currentTotal + currentCryptoToEur;

      return { pastTotal, currentTotal };
    },
    {
      pastTotal: 0,
      currentTotal: 0
    }
  );
}

function printUserPortfolio(
  bot: TelegramBot,
  msg: TelegramBot.Message
): Promise<TelegramBot.Message | Error> {
  const users = storage.getUsers();
  const currentUser = users.find(user => user.id === msg.from.id);

  if (!currentUser) {
    return;
  }

  const message = currentUser.cryptos
    .map(crypto => {
      return `***${crypto.abbreviation}:*** ${crypto.amount}`;
    })
    .join('\n');

  return bot.sendMessage(msg.from.id, message, config.messageOptions);
}
