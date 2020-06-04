import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ObjectType, JoinColumn, ManyToMany } from 'typeorm';
import { User } from './user';
import { Channel } from './channel';
import { SourceRecord } from '../types/source-record';
import { SenderFactory } from '../senders/sender-factory';

@Entity()
export class Bot {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public token: string;

  @Column({ unique: true })
  public telegramId: string;

  @Column()
  public username: string;

  @ManyToOne((): ObjectType<User> => User, (user): Bot[] => user.bots)
  @JoinColumn()
  public user: User;

  @ManyToMany((): ObjectType<Channel> => Channel, (channel): Bot[] => channel.bots, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public channels: Channel[];

  public async send(channel: Channel, records: SourceRecord[]): Promise<void> {
    return SenderFactory.getSender().send(this, channel, records);
  }
}
