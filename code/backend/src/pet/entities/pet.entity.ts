import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Pet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'float' })
  attack: number;

  @Column({ type: 'float' })
  defense: number;

  @Column({ type: 'float' })
  health: number;

  @Column({ type: 'float', default: 0 })
  xp: number;

  @Column({ type: 'int', default: 1 })
  level: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastTrainedAt: Date | null;

  @Column({ type: 'int', default: 0 })
  dailyKeystrokes: number;

  @Column({ type: 'date', nullable: true })
  dailyKeystrokesDate: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  tiredUntil: Date | null;

  @Column({ type: 'varchar', unique: true })
  accessToken: string;
}
