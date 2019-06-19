import { Sender } from './Sender';
import { SourceRecord } from '../parsers/SourceRecord';

export class SimpleSender extends Sender {
  protected _formatRecords(records: SourceRecord[]): string[] {
    return records.map(
      ({ title, dataId, source }): string => {
        const { hostname } = new URL(dataId);
        return `*${source.name}* // ${title} [(${hostname})](${dataId})`;
      },
    );
  }
}
