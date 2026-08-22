export interface PetSittingEndedEvent {
  petSittingId: string;
  senderPetId: string;
  hostPetId: string;
  endedAt: Date;
}
