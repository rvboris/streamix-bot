import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, JoinColumn, ObjectType, ManyToOne } from 'typeorm';
import { Bot } from './Bot';

@Entity()
export class Channel {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public telegramId: string;

  @Column({ nullable: true })
  public username: string;

  @Column()
  public title: string;

  @Column()
  @CreateDateColumn()
  public created: Date;

  @ManyToOne((): ObjectType<Bot> => Bot, (bot): Channel[] => bot.channels, { onDelete: 'CASCADE' })
  @JoinColumn()
  public bot: Bot;
}
