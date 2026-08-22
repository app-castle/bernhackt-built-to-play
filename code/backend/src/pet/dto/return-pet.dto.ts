import { ReturnPetStatusDto } from './return-pet-status.dto';
import { ReturnPetTrainingDto } from './return-pet-training.dto';

export class ReturnPetDto extends ReturnPetTrainingDto {
  id: string;
  name: string;
  status: ReturnPetStatusDto;
}
