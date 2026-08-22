import { BattleStatus } from '../entities/battle.entity';

export class ReturnBattleDto {
  id: string;
  challengerPetId: string;
  defenderPetId: string;
  status: BattleStatus;
  defended: boolean;
  winnerPetId: string | null;
  levelDifference: number;
  challengerXpChange: number | null;
  defenderXpChange: number | null;
  createdAt: Date;
  resolvedAt: Date | null;
}
