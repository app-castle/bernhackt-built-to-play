import { PetStatus } from '../../pet-activity/pet-status';

export class ReturnPetSummaryDto {
  id: string;
  name: string;
  level: number;
  status: PetStatus;
}
