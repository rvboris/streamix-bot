import logger from '../util/logger';

export const catchHandler = () => (error: Error): void => {
  logger.error('telegraf error', { meta: error });
};
