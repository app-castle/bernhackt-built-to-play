export type PetActivityState =
  'available' | 'raiding' | 'pet_sitting' | 'tired';

export interface PetStatus {
  state: PetActivityState;
  availableAt: Date | null;
}
