import 'reflect-metadata';
import { createConnection, Connection } from 'typeorm';
import { User, Settings, Bot, Source, Channel, Update } from '../entites';

export default async (): Promise<Connection> =>
  createConnection({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    entities: [User, Settings, Bot, Source, Channel, Update],
    synchronize: process.env.NODE_ENV !== 'production',
    logging: false,
  });
