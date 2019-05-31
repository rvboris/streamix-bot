import getTelegram from '../util/getTelegram';
import { SourceRecord } from '../parsers/SourceRecord';
import { Message } from 'telegram-typings';
import { Bot } from '../entites';

export class Sender {
  protected _formatRecords(records): string[] {
    return records.map((): string => '');
  }

  protected _concatRecords(records: string[]): string {
    return records.length ? records.join('\n\n') : '';
  }

  public send(bot: Bot, records: SourceRecord[]): Promise<Message[]> {
    const formattedRecords = this._formatRecords(records);
    const concatedRecords = this._concatRecords(formattedRecords);

    if (!concatedRecords.length) {
      return;
    }

    return Promise.all(
      bot.channels.map(
        (channel): Promise<Message> => {
          return getTelegram(bot.token).sendMessage(channel.telegramId, concatedRecords);
        },
      ),
    );
  }
}
