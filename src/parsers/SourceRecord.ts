import { Source } from '../entites';

export interface SourceRecord {
  title: string;
  url: string;
  content: string;
  date: Date;
  source: Source;
}
