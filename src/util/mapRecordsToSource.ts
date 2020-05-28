import { SourceRecord } from '../parsers/SourceRecord';
import { Record } from '../parsers/Record';
import { Source } from '../entites';

export const mapRecordsToSource = (records: Record[], source: Source): SourceRecord[] => {
  return records.map((record) => ({ ...record, source }));
};
