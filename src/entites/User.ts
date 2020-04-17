import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, ObjectType, OneToMany } from 'typeorm';
import { Settings } from './Settings';
import { Bot } from './Bot';
import { Source } from './Source';
import { Channel } from './Channel';

export enum UserStatus {
  STARTED = 1,
  INITED = 2,
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public telegramId: string;

  @Column()
  public username: string;

  @Column({ type: 'integer' })
  public status: number;

  @Column()
  @CreateDateColumn()
  public created: Date;

  @OneToOne<Settings>((): ObjectType<Settings> => Settings, (settings): User => settings.user, {
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
  })
  public settings: Settings;

  @OneToMany((): ObjectType<Bot> => Bot, (bot): User => bot.user, { onDelete: 'CASCADE' })
  public bots: Bot[];

  @OneToMany((): ObjectType<Source> => Source, (source): User => source.user, {
    onDelete: 'CASCADE',
  })
  public sources: Source[];

  @OneToMany((): ObjectType<Channel> => Channel, (channel): User => channel.user, {
    onDelete: 'CASCADE',
  })
  public channels: Channel[];

  public get isAdmin(): boolean {
    return this.telegramId === process.env.ADMIN_ID;
  }
}
