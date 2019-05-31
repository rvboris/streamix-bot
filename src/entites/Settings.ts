import { Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne, ObjectType } from 'typeorm';
import { User } from './User';
import { Bot } from './Bot';

@Entity()
export class Settings {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public language: string;

  @OneToOne((): ObjectType<Bot> => Bot, { eager: true })
  @JoinColumn()
  public defaultBot: Bot;

  @OneToOne((): ObjectType<User> => User, (user): Settings => user.settings)
  @JoinColumn()
  public user: User;
}
