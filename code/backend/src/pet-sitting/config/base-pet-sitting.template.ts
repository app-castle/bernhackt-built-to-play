import { PetSittingTemplate } from './pet-sitting-template.interface';

export const basePetSittingTemplate: PetSittingTemplate = {
  inviteExpiryMs: 5 * 60_000,
  sessionDurationMs: 60 * 60_000,
};
