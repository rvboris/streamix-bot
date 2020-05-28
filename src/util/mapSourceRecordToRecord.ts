import { SourceRecord } from '../parsers/SourceRecord';
import { Record } from '../parsers/Record';

export const mapSourceRecordToRecord = (source: SourceRecord[]): Record[] => {
  return source.map((sourceRecord) => {
    const { source, ...record } = sourceRecord;
    return record;
  });
};
