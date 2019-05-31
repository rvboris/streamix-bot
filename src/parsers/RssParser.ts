import ExternalRssParser from 'rss-parser';
import { SourceRecord } from './SourceRecord';
import { Parser } from './Parser';

export class RssParser implements Parser {
  public async parse(url: string): Promise<SourceRecord[]> {
    const { items } = await new ExternalRssParser().parseURL(url);

    return items.map(
      (record): SourceRecord => {
        return {
          title: record.title,
          url: record.link,
          content: record.content,
          date: new Date(record.isoDate),
        };
      },
    );
  }
}
