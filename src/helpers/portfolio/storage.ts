import * as fs from 'fs';

const USERS_STORAGE_PATH = './src/data/portfolio/users.json';

export interface Crypto {
  readonly abbreviation: string;
  readonly amount: number;
}

interface User {
  readonly id: number;
  readonly firstName: string;
  readonly cryptos: ReadonlyArray<Crypto>;
  readonly askedCrypto: string;
}

export function createStorage(): void {
  fs.writeFileSync(USERS_STORAGE_PATH, JSON.stringify([]));
}

export function getUsers(id: number = 0): ReadonlyArray<User> {
  const usersAsBuffer = fs.readFileSync(USERS_STORAGE_PATH);
  const usersAsString = usersAsBuffer.toString();

  try {
    const users: ReadonlyArray<User> = JSON.parse(usersAsString);

    if (id === 0) {
      return users;
    }

    const userWithId = users.filter(user => user.id === id);
    return userWithId;
  } catch {
    const users: ReadonlyArray<User> = [];
    return users;
  }
}

export function addUser(id: number, firstName: string): User {
  const user: User = {
    id,
    firstName,
    cryptos: [],
    askedCrypto: undefined
  };

  const allUsers = getUsers();
  const newUsers = allUsers.concat(user);
  const allUsersString = JSON.stringify(newUsers);

  fs.writeFileSync(USERS_STORAGE_PATH, allUsersString);

  return user;
}

export function addCrypto(id: number, value: number): void {
  const allUsers = getUsers();

  const newUsers = allUsers.map(user => {
    if (user.id !== id) {
      return user;
    }

    const cryptos = user.cryptos.filter(
      userCrypto => userCrypto.abbreviation !== user.askedCrypto
    );

    const newCrypto: Crypto = {
      abbreviation: user.askedCrypto,
      amount: value
    };

    return {
      ...user,
      askedCrypto: undefined,
      cryptos: cryptos.concat(newCrypto)
    };
  });

  const newUsersString = JSON.stringify(newUsers);
  fs.writeFileSync(USERS_STORAGE_PATH, newUsersString);
}

export function askCrypto(id: number, crypto: string): void {
  const allUsers = getUsers();
  const newUsers = allUsers.map(
    user =>
      user.id === id
        ? {
            ...user,
            askedCrypto: crypto
          }
        : user
  );

  const newUsersString = JSON.stringify(newUsers);
  fs.writeFileSync(USERS_STORAGE_PATH, newUsersString);
}

export function removeAskedCrypto(id: number): void {
  const allUsers = getUsers();
  const newUsers = allUsers.map(user => {
    const cryptosWithoutAskedCrypto = user.cryptos.filter(
      crypto => crypto.abbreviation !== user.askedCrypto
    );

    return user.id === id
      ? {
          ...user,
          askedCrypto: undefined,
          cryptos: cryptosWithoutAskedCrypto
        }
      : user;
  });

  const newUsersString = JSON.stringify(newUsers);
  fs.writeFileSync(USERS_STORAGE_PATH, newUsersString);
}
