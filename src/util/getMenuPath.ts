import { ActionCode } from '../enums';

export const getMenuPath = (...codes: ActionCode[]): string => `/${codes.join('/')}/`;
