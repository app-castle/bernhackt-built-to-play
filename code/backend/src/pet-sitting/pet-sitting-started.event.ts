export interface PetSittingStartedEvent {
  petSittingId: string;
  senderPetId: string;
  hostPetId: string;
  startedAt: Date;
  endsAt: Date;
}
