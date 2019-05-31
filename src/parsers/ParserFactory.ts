import { Parser } from './Parser';
import { RssParser } from './RssParser';
import { SourceType } from '../entites';

export class ParserFactory {
  private static _parserMap = new Map<SourceType, Parser>([[1, new RssParser()]]);

  public static getParser(sourceType: SourceType): Parser {
    return this._parserMap.get(sourceType);
  }
}
