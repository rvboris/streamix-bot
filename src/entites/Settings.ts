import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne, ObjectType } from 'typeorm';
import { User } from './User';
import { Bot } from './Bot';
import { Channel } from './Channel';

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
