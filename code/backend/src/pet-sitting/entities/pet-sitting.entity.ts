import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Pet } from '../../pet/entities/pet.entity';

export enum PetSittingStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  ENDED = 'ended',
  EXPIRED = 'expired',
}

@Entity()
export class PetSitting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  senderPetId: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'senderPetId' })
  sender: Pet;

  @Column({ type: 'uuid' })
  hostPetId: string;

  @ManyToOne(() => Pet)
  @JoinColumn({ name: 'hostPetId' })
  host: Pet;

  @Column({ type: 'text' })
  letter: string;

  @Column({
    type: 'enum',
    enum: PetSittingStatus,
    default: PetSittingStatus.PENDING,
  })
  status: PetSittingStatus;

  @Column({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt: Date | null;
}
