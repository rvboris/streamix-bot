import { getTelegram } from '../util/getTelegram';
import { SourceRecord } from '../parsers/SourceRecord';
import { Bot, Channel } from '../entites';

export class Sender {
  private _messageMaxLength = 4096;
  private _pauseBetweenMessages = 1;

  protected _formatRecords(records: SourceRecord[]): string[] {
    return records.map((): string => '');
  }

  protected _smartConcat(records: string[]): string[] {
    if (!records.length) {
      return [];
    }

    const lineBreak = '\n\n';

    let concatedRecord = '';

    return records.reduce((concatedRecords, record, idx): string[] => {
      const next = concatedRecord + record + lineBreak;
      const isLast = idx === records.length - 1;

      if (next.length > this._messageMaxLength) {
        concatedRecords.push(concatedRecord);
        concatedRecord = record + lineBreak;
      } else {
        concatedRecord = next;
      }

      if (isLast) {
        concatedRecords.push(concatedRecord);
      }

      return concatedRecords;
    }, []);
  }

  public async send(bot: Bot, channel: Channel, records: SourceRecord[]): Promise<void> {
    const formattedRecords = this._formatRecords(records);
    const concatedRecords = this._smartConcat(formattedRecords);

    if (!concatedRecords.length) {
      return;
    }

    const tlg = getTelegram(bot.token);

    for (const record of concatedRecords) {
      await tlg.sendMessage(channel.telegramId, record, {
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      });

      await new Promise((resolve) => setTimeout(resolve, this._pauseBetweenMessages * 1000));
    }
  }
}
