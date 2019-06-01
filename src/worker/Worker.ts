import interval from 'interval-promise';
import logger from '../util/logger';
import { Connection } from 'typeorm';
import { User, Source, Bot } from '../entites';
import { Logger } from 'winston';
import { MappedSourceRecords } from './MappedSourceRecords';
import { SourceRecord } from '../parsers/SourceRecord';

const DEFAULT_INTERVAL = 1800000;
const USERS_PER_QUERY = 10;

export class Worker {
  private _log: Logger;
  private _intervalTime = DEFAULT_INTERVAL;
  private _usersPerQuery = USERS_PER_QUERY;
  private _isStopped = false;
  private _connection: Connection;

  public constructor(connection: Connection) {
    this._connection = connection;
    this._log = logger.child({ isWorker: true });
  }

  public start(): Promise<void> {
    return interval(async (iterationNumber, stop): Promise<void> => {
      if (this._isStopped) {
        return stop();
      }

      this._log.debug(`start iteration ${iterationNumber}`);

      try {
        const usersCount = await this._connection.manager.count(User);

        this._log.debug(`total ${usersCount} users`);

        for (let skip = 0; skip < usersCount; skip += this._usersPerQuery) {
          this._log.debug('get next users group');

          const users = await this._connection.manager.find(User, {
            take: this._usersPerQuery,
            skip,
            loadEagerRelations: false,
          });

          for (const user of users) {
            await this._processUser(user, iterationNumber);
          }
        }
      } catch (e) {
        this._log.error(e.stack);
      }

      this._log.debug(`iteration ${iterationNumber} is finished`);
    }, this._intervalTime);
  }

  public stop(): void {
    this._isStopped = true;
  }

  private async _processUser(user: User, iterationNumber: number): Promise<void> {
    this._log.debug(`work on user ${user.id}`);

    const sources = await this._connection
      .createQueryBuilder(Source, 'source')
      .leftJoinAndSelect('source.bot', 'bot')
      .leftJoinAndSelect('bot.channels', 'channels')
      .where('source.user = :user', { user: user.id })
      .getMany();

    this._log.debug(`total of user sources is ${sources.length}`);
    this._log.debug(`starting the check of user sources`);

    const sourcesRecords = await this._processSources(sources);

    this._log.debug(`check of user sources is finished`);

    if (!sourcesRecords.length) {
      this._log.debug(`no new records, finish ${iterationNumber} iteration`);
      return;
    }

    await this._updateSourcesCheckTime(sources);

    const groupedSources = this._groupSourcesByBot(sourcesRecords);

    await this._sendRecords(groupedSources);
  }

  private async _sendRecords(groupedSources: MappedSourceRecords): Promise<void> {
    for (const [botId, { bot, records }] of groupedSources) {
      this._log.debug(`start sending ${records.length} records by ${botId} bot`);
      await bot.send(records);
      this._log.debug(`sending ${records.length} records by ${botId} bot is finished`);
    }
  }

  private async _updateSourcesCheckTime(sources: Source[]): Promise<void> {
    const sourcesIds = sources.map(
      (source): number => {
        return source.id;
      },
    );

    this._log.debug(`update sources check time`);

    await this._connection
      .createQueryBuilder(Source, 'source')
      .update(Source)
      .set({ checked: new Date() })
      .where('source.id = ANY(:ids)', { ids: sourcesIds })
      .execute();
  }

  private _groupSourcesByBot(sourcesRecords: SourceRecord[]): MappedSourceRecords {
    const sortedRecords = sourcesRecords.sort(
      (a, b): number => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sortedRecords.reduce((groupedRecords: MappedSourceRecords, record: SourceRecord): MappedSourceRecords => {
      if (!groupedRecords.get(record.source.bot.id)) {
        groupedRecords.set(record.source.bot.id, { bot: record.source.bot, records: [record] });
      } else {
        const item = groupedRecords.get(record.source.bot.id);
        item.records = [...item.records, record];
        groupedRecords.set(record.source.bot.id, item);
      }

      return groupedRecords;
    }, new Map<number, { bot: Bot; records: SourceRecord[] }>());
  }

  private async _processSources(sources: Source[]): Promise<SourceRecord[]> {
    return sources.reduce(async (previousPromise, source): Promise<SourceRecord[]> => {
      const collection = await previousPromise;

      if (!source.bot.channels.length) {
        this._log.debug(`bot ${source.bot.id} has no channels`);
        return collection;
      }

      this._log.debug(`starting parse of source ${source.id}`);

      const lastRecords = await source.parse();

      this._log.debug(`parse of source ${source.id} is finished`);

      const newRecords = lastRecords.filter((record): boolean => record.date > source.checked);

      this._log.debug(`total of new records ${newRecords.length} of source ${source.id}`);

      if (newRecords.length) {
        collection.push(...newRecords);
      }

      return collection;
    }, Promise.resolve([]));
  }
}
