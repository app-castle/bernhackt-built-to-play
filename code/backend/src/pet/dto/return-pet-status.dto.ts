import { PetActivityState } from '../../pet-activity/pet-status';

export class ReturnPetStatusDto {
  state: PetActivityState;
  availableAt: Date | null;
}
