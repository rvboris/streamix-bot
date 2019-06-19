import { SourceRecord } from '../parsers/SourceRecord';
import { Channel } from '../entites';

export type MappedSourceRecords = Map<number, { channel: Channel; records: SourceRecord[] }>;
