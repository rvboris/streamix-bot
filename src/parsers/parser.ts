import { SourceRecord } from '../types/source-record';
import { Source } from '../entites';

export interface Parser {
  parse(source: Source): Promise<SourceRecord[]>;
  try(source: string): Promise<void>;
}
