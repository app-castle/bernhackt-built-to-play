import { ReturnPetDto } from './return-pet.dto';

export class ReturnCreatedPetDto extends ReturnPetDto {
  accessToken: string;
}
