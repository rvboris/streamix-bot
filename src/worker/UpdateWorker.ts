import interval from 'interval-promise';
import pLimit, { Limit } from 'p-limit';
import { Channel, Source, SourceType, User } from '../entites';
import { Connection } from 'typeorm';
import { logger } from '../util/logger';
import { Logger } from 'winston';
import { MappedSourceRecords } from './MappedSourceRecords';
import { mapRecordsToSource } from '../util/mapRecordsToSource';
import { mapSourceRecordToRecord } from '../util/mapSourceRecordToRecord';
import { Record } from '../parsers/Record';
import { SourceRecord } from '../parsers/SourceRecord';
import { UpdateManager } from './UpdateManager';

const DEFAULT_INTERVAL = 15 * 60 * 1000;
const USERS_PER_QUERY = 10;

export class UpdateWorker {
  private _log: Logger;
  private _intervalTime = DEFAULT_INTERVAL;
  private _usersPerQuery = USERS_PER_QUERY;
  private _isStopped = false;
  private _connection: Connection;
  private _proccesedCache: Map<string, Record[]>;
  private _updateControl: UpdateManager;
  private _usersIterationConcurrent: Limit;
  private _sourcesConcurrent: Limit;
  private _sendingConcurrent: Limit;

  public constructor(connection: Connection) {
    this._connection = connection;
    this._log = logger.child({ isWorker: true });
    this._proccesedCache = new Map<string, SourceRecord[]>();
    this._updateControl = new UpdateManager(this._connection);
    this._usersIterationConcurrent = pLimit(USERS_PER_QUERY);
    this._sourcesConcurrent = pLimit(3);
    this._sendingConcurrent = pLimit(3);
  }

  public async start(): Promise<void> {
    await this._processInterval(0);
    return interval(this._processInterval.bind(this), this._intervalTime);
  }

  public stop(): void {
    this._isStopped = true;
  }

  private async _processInterval(iterationNumber: number, stop?: () => void): Promise<void> {
    if (this._isStopped && stop) {
      return stop();
    }

    this._log.info(`start iteration ${iterationNumber}`);

    await this._updateControl.cleanUp();

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

        await Promise.all<void>(
          users.map((user) => {
            return this._usersIterationConcurrent(() => this._processUser(user));
          }),
        );
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

  private async _checkSourcesDate(sourcesRecords: SourceRecord[]): Promise<SourceRecord[]> {
    return Promise.all(
      sourcesRecords.map(async (sourceRecord) => {
        return {
          ...sourceRecord,
          date: await this._updateControl.getSourceRecordDate(sourceRecord),
        };
      }),
    );
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
    Promise.all(
      Array.from(groupedRecords).map(([, { channel, records }]) => {
        this._sendingConcurrent(() => {
          const bots = channel.bots;
          const useBot = bots[Math.floor(Math.random() * bots.length)];

          this._log.info(`start sending ${records.length} records by ${useBot.username}#${useBot.id} bot`);

          return useBot.send(channel, records).then((): void => {
            this._log.info(`sending ${records.length} records by ${useBot.username}#${useBot.id} bot is finished`);
          });
        });
      }),
    );
  }

  private async _updateSourcesCheckTime(sources: Source[]): Promise<void> {
    const sourcesIds = sources.map((source): number => {
      return source.id;
    });

    this._log.info(`update sources check time`);

    await this._connection
      .createQueryBuilder(Source, 'source')
      .update(Source)
      .set({ checked: new Date() })
      .where('source.id = ANY(:ids)', { ids: sourcesIds })
      .execute();
  }

  private _getCacheKey({ dataId, type }: Source): string {
    if (type === SourceType.RSS) {
      const { host, pathname } = new URL(dataId);
      return `${host}${pathname}`;
    }

    return dataId;
  }

  private async _processSources(sources: Source[]): Promise<SourceRecord[]> {
    const recordsBySources = await Promise.all(
      sources.map((source) => {
        return this._sourcesConcurrent(async () => {
          const cacheKey = this._getCacheKey(source);
          const isSourceCached = this._proccesedCache.has(cacheKey);

          if (isSourceCached) {
            this._log.info(`get source from cache ${source.name}#${source.id}`);
            return mapRecordsToSource(this._proccesedCache.get(cacheKey), source);
          }

          this._log.info(`starting parse of source ${source.name}#${source.id}`);

          const lastRecords = await source.parse();

          this._log.info(`parse of source ${source.name}#${source.id} is finished`);
          this._log.info(`total of records ${lastRecords.length} of source ${source.name}#${source.id}`);

          const sourcesRecordsWithDates = await this._checkSourcesDate(lastRecords);
          const newRecords = sourcesRecordsWithDates.filter((record): boolean => record.date > source.checked);

          this._log.info(`total of new records ${newRecords.length} of source ${source.name}#${source.id}`);

          if (newRecords.length) {
            this._proccesedCache.set(cacheKey, mapSourceRecordToRecord(newRecords));
          }

          return newRecords;
        });
      }),
    );

    return recordsBySources.reduce((acc, prev) => [...acc, ...prev], []);
  }
}
