import { IsPositive, Max } from 'class-validator';

export class TrainPetDto {
  @IsPositive()
  @Max(500)
  intensity: number;
}
