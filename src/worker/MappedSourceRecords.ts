import { SourceRecord } from '../parsers/SourceRecord';
import { Bot } from '../entites';

export type MappedSourceRecords = Map<number, { bot: Bot; records: SourceRecord[] }>;
