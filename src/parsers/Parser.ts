import { SourceRecord } from './SourceRecord';
import { Source } from '../entites';

export interface Parser {
  parse(source: Source): Promise<SourceRecord[]>;
}
