import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePetSittingDto {
  @IsUUID()
  hostPetId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  letter: string;
}
