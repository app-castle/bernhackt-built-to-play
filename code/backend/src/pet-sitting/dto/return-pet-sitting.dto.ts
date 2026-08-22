import { PetSittingStatus } from '../entities/pet-sitting.entity';

export class ReturnPetSittingDto {
  id: string;
  senderPetId: string;
  hostPetId: string;
  letter: string;
  status: PetSittingStatus;
  createdAt: Date;
  acceptedAt: Date | null;
  endedAt: Date | null;
}
