import { Sender } from './Sender';
import { SourceRecord } from '../parsers/SourceRecord';

export class SimpleSender extends Sender {
  protected _formatRecords(records: SourceRecord[]): string[] {
    return records.map(
      ({ title, url, source }): string => {
        return `*${source.name}* // ${title} [(link)](${url})`;
      },
    );
  }
}
