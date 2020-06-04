import { logger } from '../utils/logger';

export const catchHandler = () => (error: Error): void => {
  logger.error('telegraf error', { meta: error });
};
