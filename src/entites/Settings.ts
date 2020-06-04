import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne, ObjectType } from 'typeorm';
import { User } from './user';
import { Bot } from './bot';
import { Channel } from './channel';

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public language: string;

  @OneToOne((): ObjectType<Bot> => Bot, { eager: true })
  @JoinColumn()
  public defaultBot: Bot;

  @OneToOne((): ObjectType<Channel> => Channel, { eager: true })
  @JoinColumn()
  public defaultChannel: Channel;

  @OneToOne((): ObjectType<User> => User, (user): Settings => user.settings)
  @JoinColumn()
  public user: User;
}
