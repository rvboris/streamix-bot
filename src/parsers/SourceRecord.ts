import { Source } from '../entites';

export interface SourceRecord {
  uuid: string;
  title: string;
  dataId: string;
  content: string;
  date: Date | null;
  source: Source;
}
