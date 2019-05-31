import interval from 'interval-promise';
import logger from './util/logger';
import { Connection } from 'typeorm';
import { User, Source } from './entites';
import { SourceRecord } from './parsers/SourceRecord';

export default async (connection?: Connection): Promise<void> => {
  const DEFAULT_INTERVAL = 30000;

  return interval(async (iterationNumber): Promise<void> => {
    logger.debug(`worker: start iteration ${iterationNumber}`);

    try {
      const usersCount = await connection.manager.count(User);

      logger.debug(`worker: total ${usersCount} users`);

      for (let skip = 0; skip < usersCount; skip += 3) {
        logger.debug('worker: get next users group');

        const users = await connection.manager.find(User, { take: 3, skip, loadEagerRelations: false });

        for (const user of users) {
          logger.debug(`worker: working on user ${user.id}`);

          const sources = await connection
            .createQueryBuilder(Source, 'source')
            .leftJoinAndSelect('source.bot', 'bot')
            .leftJoinAndSelect('bot.channels', 'channels')
            .where('source.user = :user', { user: user.id })
            .getMany();

          logger.debug(`worker: total of user sources ${sources.length}`);

          const sourcesIds = sources.map(
            (source): number => {
              return source.id;
            },
          );

          logger.debug(`worker: check user sources`);

          const sourcesRecords = await Promise.all(
            sources.map(
              async (source): Promise<{ source: Source; records: SourceRecord[] }> => {
                if (!source.bot.channels.length) {
                  logger.debug(`worker: bot ${source.bot.id} has no channels`);
                  return { source, records: [] };
                }

                logger.debug(`worker: parse source ${source.id}`);

                const allRecords = await source.parse();
                const records = allRecords.filter((record): boolean => record.date > source.checked);

                logger.debug(`worker: total of new records ${records.length} of source ${source.id}`);

                return { source, records };
              },
            ),
          );

          const now = new Date();

          logger.debug(`worker: update sources check time`);

          await connection
            .createQueryBuilder(Source, 'source')
            .update(Source)
            .set({ checked: now })
            .where('source.id = ANY(:ids)', { ids: sourcesIds })
            .execute();

          logger.debug(`worker: start sending`);

          for (const { source, records } of sourcesRecords) {
            logger.debug(`worker: send ${records.length} records by ${source.bot.id} bot`);
            await source.send(source.bot, records);
          }

          logger.debug(`worker: sending is finished`);
        }
      }
    } catch (e) {
      logger.error(e.stack);
    }

    logger.debug(`worker: iteration ${iterationNumber} is finished`);
  }, DEFAULT_INTERVAL);
};
