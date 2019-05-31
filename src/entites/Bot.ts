import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ObjectType, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { Source } from './Source';
import { Channel } from './Channel';

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

  @OneToMany((): ObjectType<Source> => Source, (source): Bot => source.bot)
  public sources: Source[];

  @OneToMany((): ObjectType<Channel> => Channel, (channel): Bot => channel.bot)
  public channels: Channel[];
}
