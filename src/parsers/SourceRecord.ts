import { Source } from '../entites';

export interface SourceRecord {
  title: string;
  dataId: string;
  content: string;
  date: Date;
  source: Source;
}
