import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../../pet/entities/pet.entity';

@Entity()
export class Quest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  petId: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'petId' })
  pet: Pet;

  @Column({ type: 'varchar' })
  kind: string;

  @Column({ type: 'text', array: true })
  words: string[];

  @Column({ type: 'text' })
  outcomeText: string;

  @Column({ type: 'int' })
  outcomeScore: number;

  @Column({ type: 'varchar' })
  rewardedStat: 'attack' | 'defense' | 'health';

  @Column({ type: 'float' })
  rewardAmount: number;

  @Column({ type: 'timestamptz' })
  createdAt: Date;
}
