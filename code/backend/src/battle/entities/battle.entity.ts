import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../../pet/entities/pet.entity';

export enum BattleStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
}

@Entity()
export class Battle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  challengerPetId: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'challengerPetId' })
  challenger: Pet;

  @Column({ type: 'uuid' })
  defenderPetId: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'defenderPetId' })
  defender: Pet;

  @Column({ type: 'enum', enum: BattleStatus, default: BattleStatus.PENDING })
  status: BattleStatus;

  @Column({ default: false })
  defended: boolean;

  @Column({ type: 'uuid', nullable: true })
  winnerPetId: string | null;

  @ManyToOne(() => Pet, { nullable: true })
  @JoinColumn({ name: 'winnerPetId' })
  winner: Pet | null;

  @Column({ type: 'int' })
  levelDifference: number;

  @Column({ type: 'float', nullable: true })
  challengerXpChange: number | null;

  @Column({ type: 'float', nullable: true })
  defenderXpChange: number | null;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
