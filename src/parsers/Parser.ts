import { SourceRecord } from './SourceRecord';

export interface Parser {
  parse(url: string): Promise<SourceRecord[]>;
}
