import ExternalRssParser from 'rss-parser';
import { SourceRecord } from './SourceRecord';
import { Parser } from './Parser';
import { Source } from '../entites';

export class RssParser implements Parser {
  public async parse(source: Source): Promise<SourceRecord[]> {
    const { items } = await new ExternalRssParser().parseURL(source.url);

    return items.map(
      (record): SourceRecord => {
        return {
          title: record.title,
          url: record.link,
          content: record.content,
          date: new Date(record.isoDate),
          source,
        };
      },
    );
  }
}
