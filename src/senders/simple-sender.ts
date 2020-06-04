import { Sender } from './sender';
import { SourceRecord } from '../types/source-record';

export class SimpleSender extends Sender {
  protected _formatRecords(records: SourceRecord[]): string[] {
    return records.map(({ title, dataId, source }): string => {
      const { hostname } = new URL(dataId);
      return `*${source.name}* // ${title} [(${hostname})](${dataId})`;
    });
  }
}
