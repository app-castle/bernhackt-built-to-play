import { API_URL } from "@/lib/api";
import { useEffect } from "react";
import { useToken } from "./useToken";

interface BattleChallange {
  battleId: string;
  defenderPetId: string;
  challengerPetId: string;
  challengerName: string;
  challengerLevel: number;
  expiresAt: Date;
}

interface BattleResolved {
  battleId: string;
  challengerPetId: string;
  defenderPetId: string;
  winnerPetId: string;
  defended: boolean;
  challengerXpChange: number;
  defenderXpChange: number;
  resolvedAt: Date;
}

export const useBattleEvents = ({
  onBattleChallenged,
  onBattleResolved,
}: {
  onBattleChallenged?: (data: BattleChallange) => void;
  onBattleResolved?: (data: BattleResolved) => void;
} = {}) => {
  const { token } = useToken();

  useEffect(() => {
    const eventSource = new EventSource(
      `${API_URL}/battles/events?token=${token}`,
    );

    const abortController = new AbortController();

    if (onBattleChallenged) {
      eventSource.addEventListener(
        "battle.challenged",
        (event) => {
          const rawData = JSON.parse(event.data);

          onBattleChallenged({
            ...rawData,
            expiresAt: new Date(rawData.expiresAt),
          });
        },
        { signal: abortController.signal },
      );
    }

    if (onBattleResolved) {
      eventSource.addEventListener(
        "battle.resolved",
        (event) => {
          const rawData = JSON.parse(event.data);

          onBattleResolved({
            ...rawData,
            resolvedAt: new Date(rawData.resolvedAt),
          });
        },
        { signal: abortController.signal },
      );
    }

    return () => {
      abortController.abort();
      eventSource.close();
    };
  }, [onBattleChallenged, onBattleResolved]);
};
