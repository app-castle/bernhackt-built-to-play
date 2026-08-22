export interface BattleChallengeEvent {
  battleId: string;
  defenderPetId: string;
  challengerPetId: string;
  challengerName: string;
  challengerLevel: number;
  expiresAt: Date;
}
