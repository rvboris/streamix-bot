import { Record } from './record';
import { Source } from '../entites';

export type SourceRecord = Record & {
  source: Source;
};
