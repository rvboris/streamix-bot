import interval from 'interval-promise';
import logger from '../util/logger';
import { Connection } from 'typeorm';
import { User, Source, Channel, SourceType } from '../entites';
import { Logger } from 'winston';
import { MappedSourceRecords } from './MappedSourceRecords';
import { SourceRecord } from '../parsers/SourceRecord';

const DEFAULT_INTERVAL = 15 * 60 * 1000;
const USERS_PER_QUERY = 10;

export class Worker {
  private _log: Logger;
  private _intervalTime = DEFAULT_INTERVAL;
  private _usersPerQuery = USERS_PER_QUERY;
  private _isStopped = false;
  private _connection: Connection;
  private _proccesedCache: Map<string, SourceRecord[]>;

  public constructor(connection: Connection) {
    this._connection = connection;
    this._log = logger.child({ isWorker: true });
    this._proccesedCache = new Map<string, SourceRecord[]>();
  }

  public async start(): Promise<void> {
    await this._processInterval(0);
    return interval(this._processInterval.bind(this), this._intervalTime);
  }

  public stop(): void {
    this._isStopped = true;
  }

  private async _processInterval(iterationNumber: number, stop?: Function): Promise<void> {
    if (this._isStopped && stop) {
      return stop();
    }

    this._log.info(`start iteration ${iterationNumber}`);

    this._proccesedCache.clear();

    try {
      const usersCount = await this._connection.manager.count(User);

      this._log.info(`total ${usersCount} users`);

      for (let skip = 0; skip < usersCount; skip += this._usersPerQuery) {
        this._log.info('get next users group');

        const users = await this._connection.manager.find(User, {
          take: this._usersPerQuery,
          skip,
          loadEagerRelations: false,
        });

        for (const user of users) {
          await this._processUser(user);
        }
      }
    } catch (e) {
      this._log.error(e.stack);
    }

    this._log.info(`iteration ${iterationNumber} is finished`);
  }

  private async _processUser(user: User): Promise<void> {
    this._log.info(`work on user ${user.username}#${user.id}`);

    const sources = await this._connection
      .createQueryBuilder(Source, 'source')
      .leftJoinAndSelect('source.channel', 'channel')
      .leftJoinAndSelect('channel.bots', 'bots')
      .where('source.user = :user', { user: user.id })
      .getMany();

    this._log.info(`total of user sources is ${sources.length}`);
    this._log.info(`starting the check of user sources`);

    const sourcesRecords = await this._processSources(sources);

    this._log.info(`check of user sources is finished`);

    if (!sourcesRecords.length) {
      this._log.info(`no new records`);
      return;
    }

    await this._updateSourcesCheckTime(sources);

    if (process.env.NODE_ENV !== 'production' && user.telegramId !== process.env.ADMIN_ID) {
      this._log.info(`skip non admin user in development mode`);
      return;
    }

    const groupedSources = this._groupSourcesByChannel(sourcesRecords);

    await this._sendRecords(groupedSources);
  }

  private _groupSourcesByChannel(sourcesRecords: SourceRecord[]): MappedSourceRecords {
    const sortedRecords = sourcesRecords.sort(
      (a, b): number => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return sortedRecords.reduce((groupedRecords: MappedSourceRecords, record: SourceRecord): MappedSourceRecords => {
      const channel = record.source.channel;

      if (!groupedRecords.get(channel.id)) {
        groupedRecords.set(channel.id, { channel, records: [record] });
      } else {
        const item = groupedRecords.get(channel.id);
        item.records = [...item.records, record];
        groupedRecords.set(channel.id, item);
      }

      return groupedRecords;
    }, new Map<number, { channel: Channel; records: SourceRecord[] }>());
  }

  private _sendRecords(groupedRecords: MappedSourceRecords): void {
    for (const [, { channel, records }] of groupedRecords) {
      const bots = channel.bots;
      const useBot = bots[Math.floor(Math.random() * bots.length)];

      this._log.info(`start sending ${records.length} records by ${useBot.username}#${useBot.id} bot`);

      useBot.send(channel, records).then(() => {
        this._log.info(`sending ${records.length} records by ${useBot.username}#${useBot.id} bot is finished`);
      });
    }
  }

  private async _updateSourcesCheckTime(sources: Source[]): Promise<void> {
    const sourcesIds = sources.map(
      (source): number => {
        return source.id;
      },
    );

    this._log.info(`update sources check time`);

    await this._connection
      .createQueryBuilder(Source, 'source')
      .update(Source)
      .set({ checked: new Date() })
      .where('source.id = ANY(:ids)', { ids: sourcesIds })
      .execute();
  }

  private _getCacheKey({dataId, type}: Source): string {
    if (type === SourceType.RSS) {
      const {host, pathname} = new URL(dataId);
      return `${host}${pathname}`;
    }

    return dataId;
  }

  private async _processSources(sources: Source[]): Promise<SourceRecord[]> {
    return sources.reduce(async (previousPromise, source): Promise<SourceRecord[]> => {
      const collection = await previousPromise;

      let lastRecords;

      const cacheKey = this._getCacheKey(source);
      const isSourceCached = this._proccesedCache.has(cacheKey);

      if (isSourceCached) {
        lastRecords = this._proccesedCache.get(cacheKey);
        collection.push(...lastRecords);

        this._log.info(`get source from cache ${source.name}#${source.id}`);

        return collection;
      }

      this._log.info(`starting parse of source ${source.name}#${source.id}`);

      lastRecords = await source.parse();

      this._log.info(`parse of source ${source.name}#${source.id} is finished`);

      const newRecords = lastRecords.filter((record): boolean => record.date > source.checked);

      this._log.info(`total of new records ${newRecords.length} of source ${source.name}#${source.id}`);

      if (newRecords.length) {
        collection.push(...newRecords);
        this._proccesedCache.set(cacheKey, newRecords);
      }

      return collection;
    }, Promise.resolve([]));
  }
}
