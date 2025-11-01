// ? The simple utils to logging.
// ? In the future, this will be replaced with a more complex logger.
const prefix = 'fbcmf ::';
const prefixMarkup = [`%c${prefix}%c `, `background-color: #ced1d6; color: black`];

interface Logger {
  (...args: any[]): void;
  error(...args: any[]): void;
  warn(...args: any[]): void;
  debug(...args: any[]): void;
  info(...args: any[]): void;
}

const log = ((...args: any[]): void => {
  console.log(...prefixMarkup, ...args);
}) as Logger;

log.error = (...args: any[]): void => {
  console.error(...prefixMarkup, ...args);
};

log.warn = (...args: any[]): void => {
  console.warn(...prefixMarkup, ...args);
};

log.debug = (...args: any[]): void => {
  if (typeof console.debug === 'function') {
    console.debug(...prefixMarkup, ...args);
  } else {
    console.log(...prefixMarkup, '[DEBUG]', ...args);
  }
};

log.info = (...args: any[]): void => {
  console.info(...prefixMarkup, ...args);
};

export {
  log
};
