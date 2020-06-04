import { SourceRecord } from '../types/source-record';
import { Channel } from '../entites';

export type MappedSourceRecords = Map<number, { channel: Channel; records: SourceRecord[] }>;
