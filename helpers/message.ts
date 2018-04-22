import { config } from '../config';

export function parseArgs(matches: RegExpExecArray | null): string[] {
  if (matches && matches[1]) {
    const argsVar: string = matches[1];
    return argsVar.split(' ');
  }

  return [];
}

export function errorHandling(error: string): void {
  console.log(config.consoleStyle, error);
}
  