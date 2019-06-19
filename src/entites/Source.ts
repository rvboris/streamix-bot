import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, ObjectType, CreateDateColumn } from 'typeorm';
import { Bot } from './Bot';
import { User } from './User';
import { ParserFactory } from '../parsers/ParserFactory';
import { SourceRecord } from '../parsers/SourceRecord';
import { Channel } from './Channel';

export enum SourceType {
  RSS = 1,
}

@Entity()
export class Source {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public dataId: string;

  @Column()
  public name: string;

  @Column({ type: 'integer' })
  public type: number;

  @CreateDateColumn()
  public created: Date;

  @Column()
  public checked: Date;

  @ManyToOne((): ObjectType<Channel> => Channel, (channel): Source[] => channel.sources, { onDelete: 'CASCADE' })
  @JoinColumn()
  public channel: Channel;

  @ManyToOne((): ObjectType<User> => User, (user): Source[] => user.sources)
  @JoinColumn()
  public user: User;

  public async parse(): Promise<SourceRecord[]> {
    return ParserFactory.getParser(this.type).parse(this);
  }
}
