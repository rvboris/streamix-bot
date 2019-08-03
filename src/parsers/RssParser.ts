import request from 'request';
import FeedParser, { Item } from 'feedparser';
import { SourceRecord } from './SourceRecord';
import { Parser } from './Parser';
import { Source } from '../entites';
import { decodeStream } from 'iconv-lite';

export class RssParser implements Parser {
  public async try(url: string): Promise<void> {
    await this._parseSourceByUrl(url);
  }

  public async parse(source: Source): Promise<SourceRecord[]> {
    const items = await this._parseSourceByUrl(source.dataId);

    return items.map(
      (record): SourceRecord => {
        return {
          uuid: record.guid,
          title: record.title,
          dataId: record.link,
          content: record.summary,
          date: record.date,
          source,
        };
      },
    );
  }

  private _getCharset(httpResponse): Record<string, any> {
    const contentType = httpResponse.headers['content-type'] || '';
    const params = contentType.split(';').reduce((params, param): any => {
      const parts = param.split('=').map((part: string): string => {
        return part.trim();
      });

      if (parts.length === 2) {
        params[parts[0]] = parts[1];
      }

      return params;
    }, {});

    return params;
  }

  private _parseSourceByUrl(url: string): Promise<Item[]> {
    return new Promise((resolve, reject): void => {
      const req = request(url);
      const getCharset = this._getCharset;
      const maybeConvert = this._fixCharset;
      const checkForNoneLengthEnclosures = this._checkForNoneLengthEnclosures;
      const feedparser = new FeedParser({});
      const items = [];

      feedparser.on('readable', function(): void {
        const stream = this;

        let item: Item;

        while ((item = stream.read())) {
          items.push(checkForNoneLengthEnclosures(item));
        }
      });

      feedparser.on('end', function(): void {
        resolve(items);
      });

      req.on('response', function(res): void {
        const charset = getCharset(res).charset;

        if (res.statusCode !== 200) {
          this.emit('error', new Error('Bad status code'));
        } else {
          res = maybeConvert(res, charset);
          res.pipe(feedparser);
        }
      });

      req.on('error', reject);
    });
  }

  private _fixCharset(res: request.Response, charset: string): request.Response {
    if (charset && !/utf-*8/i.test(charset)) {
      try {
        const iconv = decodeStream(charset);
        res = res.pipe(iconv as any);
      } catch (err) {
        res.emit('error', err);
      }
    }

    return res;
  }

  private _checkForNoneLengthEnclosures(item): Item {
    if (item.enclosures) {
      item.enclosures = item.enclosures.map((enc: any): any => {
        if (enc.length === 'None') {
          enc.length = 0;
        }

        return enc;
      });
    }

    return item;
  }
}
