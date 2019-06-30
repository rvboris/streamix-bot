import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, ObjectType, ManyToOne, OneToMany, ManyToMany, JoinTable } from 'typeorm';
import { Bot } from './Bot';
import { Source } from './Source';
import { User } from './User';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public telegramId: string;

  @Column({ nullable: true })
  public username?: string;

  @Column()
  public title: string;

  @Column()
  @CreateDateColumn()
  public created: Date;

  @ManyToOne((): ObjectType<User> => User, (user): Channel[] => user.channels)
  @JoinColumn()
  public user: User;

  @ManyToMany((): ObjectType<Bot> => Bot, (bot): Channel[] => bot.channels)
  @JoinTable()
  public bots: Bot[];

  @OneToMany((): ObjectType<Source> => Source, (source): Channel => source.channel)
  public sources: Source[];

  public get name(): string {
    return this.username || this.title;
  }
}
