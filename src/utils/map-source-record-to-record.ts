import { SourceRecord } from '../types/source-record';
import { Record } from '../types/record';

export const mapSourceRecordToRecord = (source: SourceRecord[]): Record[] => {
  return source.map((sourceRecord) => {
    const { source, ...record } = sourceRecord;
    return record;
  });
};
