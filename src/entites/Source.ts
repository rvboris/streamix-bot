import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ObjectType, CreateDateColumn } from 'typeorm';
import { Bot } from './Bot';
import { User } from './User';
import { ParserFactory } from '../parsers/ParserFactory';
import { SourceRecord } from '../parsers/SourceRecord';
import { SenderFactory } from '../senders/SenderFactory';
import { Message } from 'telegram-typings';

export enum SourceType {
  RSS = 1,
}

@Entity()
export class Source {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne((): ObjectType<Bot> => Bot, (bot): Source[] => bot.sources, { onDelete: 'CASCADE' })
  @JoinColumn()
  public bot: Bot;

  @ManyToOne((): ObjectType<User> => User, (user): Source[] => user.sources)
  @JoinColumn()
  public user: User;

  @Column()
  public url: string;

  @Column()
  public name: string;

  @Column({ type: 'integer' })
  public type: number;

  @CreateDateColumn()
  public created: Date;

  @Column()
  public checked: Date;

  public async parse(): Promise<SourceRecord[]> {
    return ParserFactory.getParser(this.type).parse(this.url);
  }

  public async send(bot: Bot, records: SourceRecord[]): Promise<Message[]> {
    return SenderFactory.getSender().send(bot, records);
  }
}
