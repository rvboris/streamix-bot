import axios from 'axios';
import pickup from 'pickup';
import { decodeStream } from 'iconv-lite';
import { getCharset } from '../utils/get-charset';
import { parseISO } from 'date-fns';
import { Parser } from './parser';
import { RssFeedItem } from '../types/rss-feed-item';
import { Source } from '../entites';
import { SourceRecord } from '../types/source-record';

export class RssParser implements Parser {
  public async try(url: string): Promise<void> {
    await this._parseSourceByUrl(url);
  }

  public async parse(source: Source): Promise<SourceRecord[]> {
    const items = await this._parseSourceByUrl(source.dataId);

    return items.map(
      (record): SourceRecord => {
        return {
          uuid: record.id,
          title: record.title,
          dataId: record.link,
          content: record.summary,
          date: parseISO(record.updated),
          source,
        };
      },
    );
  }

  private async _parseSourceByUrl(url: string): Promise<RssFeedItem[]> {
    const response = await axios({
      method: 'get',
      url: url,
      timeout: 3000,
      responseType: 'stream',
    });

    const { data, headers } = response;
    const charset = getCharset(headers);
    const stream = data.pipe(decodeStream(charset)).pipe(pickup({ eventMode: true, charset: 'utf-8' }));
    const items: RssFeedItem[] = [];

    return new Promise<RssFeedItem[]>((resolve, reject): void => {
      stream.on('error', reject);

      stream.on('entry', (item) => {
        items.push(item);
      });

      stream.on('feed', () => {
        resolve(items);
      });
    });
  }
}
