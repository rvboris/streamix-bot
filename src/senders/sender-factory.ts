import { Sender } from './sender';
import { SimpleSender } from './simple-sender';

export class SenderFactory {
  private static _senderMap = new Map<string, Sender>([['simple', new SimpleSender()]]);

  public static getSender(): Sender {
    return this._senderMap.get('simple');
  }
}
