import { Record } from './Record';
import { Source } from '../entites';

export interface SourceRecord extends Record {
  source: Source;
}
