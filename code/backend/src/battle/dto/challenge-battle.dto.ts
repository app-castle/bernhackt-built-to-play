import { IsUUID } from 'class-validator';

export class ChallengeBattleDto {
  @IsUUID()
  defenderPetId: string;
}
