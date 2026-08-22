export interface BattleResolvedEvent {
  battleId: string;
  challengerPetId: string;
  defenderPetId: string;
  winnerPetId: string;
  defended: boolean;
  challengerXpChange: number;
  defenderXpChange: number;
  resolvedAt: Date;
}
