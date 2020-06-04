import { SourceRecord } from '../types/source-record';
import { Record } from '../types/record';
import { Source } from '../entites';

export const mapRecordsToSource = (records: Record[], source: Source): SourceRecord[] => {
  return records.map((record) => ({ ...record, source }));
};
