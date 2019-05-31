import logger from '../util/logger';

export const catchHandler = (): Function => (error: any): void => {
  logger.error('telegraf error', undefined, error.response, error.parameters, error.on || error);
};
