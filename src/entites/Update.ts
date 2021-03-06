import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ObjectType, ManyToOne } from 'typeorm';
import { Source } from './source';

@Entity()
export class Update {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true })
  public uuid: string;

  @CreateDateColumn()
  public created: Date;

  @Column()
  public checked: Date;

  @ManyToOne((): ObjectType<Source> => Source, (source): Update[] => source.updates, {
    onDelete: 'CASCADE',
  })
  public source: Source;
}
