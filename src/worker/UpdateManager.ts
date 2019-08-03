import logger from '../util/logger';
import { SourceRecord } from '../parsers/SourceRecord';
import { Connection } from 'typeorm';
import { Logger } from 'winston';
import { Update } from '../entites/Update';
import { createHash } from 'crypto';
import { subDays, format } from 'date-fns';

export class UpdateManager {
  private readonly _connection: Connection;
  private readonly _log: Logger;
  private readonly _clearDays = 90;

  public constructor(connection: Connection) {
    this._connection = connection;
    this._log = logger.child({ isUpdateManager: true });
  }

  public async getSourceRecordDate(sourceRecord: SourceRecord): Promise<Date> {
    this._log.info(`check date for record of ${sourceRecord.source.name}#${sourceRecord.source.id} source`);

    if (sourceRecord.date) {
      this._log.info(`date for record of ${sourceRecord.source.name}#${sourceRecord.source.id} source is ok`);
      return sourceRecord.date;
    }

    this._log.info(
      `date for record of ${sourceRecord.source.name}#${sourceRecord.source.id} source is empty, check updates`,
    );
    const sourceRecordUpdate = await this._getSourceRecordUpdate(sourceRecord);

    return sourceRecordUpdate.created;
  }

  public async cleanUp(): Promise<number> {
    const cleanDate = subDays(new Date(), this._clearDays);
    const formattedDate = format(cleanDate, 'MM/DD/YYYY');

    this._log.info(`cleanup updates - clean date is ${formattedDate}`);

    const deleteQuery = await this._connection.manager
      .createQueryBuilder(Update, 'update')
      .where('update.checked < :cleanDate', { cleanDate })
      .delete()
      .execute();

    this._log.info(`cleanup updates finished - ${deleteQuery.affected} items deleted`);

    return deleteQuery.affected;
  }

  private async _getSourceRecordUpdate(sourceRecord: SourceRecord): Promise<Update> {
    const sourceRecordHash = this._getSourceRecordHash(sourceRecord);

    this._log.info(
      `hash for record of ${sourceRecord.source.name}#${sourceRecord.source.id} source is #${sourceRecordHash}`,
    );

    const update = await this._connection.manager.findOne(Update, { uuid: sourceRecordHash });

    if (update) {
      this._log.info(`update for hash ${sourceRecordHash} already exists`);
      update.checked = new Date();
      return this._connection.manager.save(update);
    }

    const newUpdate = new Update();

    newUpdate.uuid = sourceRecordHash;
    newUpdate.source = sourceRecord.source;
    newUpdate.checked = new Date();

    this._log.info(
      `update for hash ${sourceRecordHash} of ${sourceRecord.source.name}#${sourceRecord.source.id} created`,
    );

    return this._connection.manager.save(newUpdate);
  }

  private _getSourceRecordHash(sourceRecord: SourceRecord): string {
    return createHash('sha1')
      .update(sourceRecord.uuid)
      .digest('hex');
  }
}
