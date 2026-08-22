export interface PetSittingInvitedEvent {
  petSittingId: string;
  senderPetId: string;
  senderName: string;
  hostPetId: string;
  letter: string;
  expiresAt: Date;
}
