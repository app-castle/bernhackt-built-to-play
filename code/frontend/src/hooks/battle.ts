import { API_URL } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToken } from "./useToken";

interface Player {
  id: string;
  name: string;
}

export const usePlayers = () => {
  const { token } = useToken();

  const playersQuery = useQuery<Player[]>({
    queryKey: ["pets"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/pets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status !== 200) {
        throw new Error("Failed to fetch battle players");
      }
      return response.json();
    },
  });

  return {
    players: playersQuery.data,
    isLoading: playersQuery.isLoading,
    error: playersQuery.error,
  };
};

interface ChallengeBattleDto {
  defenderPetId: string;
}

export const useRaid = () => {
  const { token } = useToken();

  const raidMutation = useMutation({
    mutationFn: async ({ defenderPetId }: ChallengeBattleDto) => {
      const response = await fetch(`${API_URL}/battles`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ defenderPetId }),
      });

      if (response.status !== 201) {
        throw new Error("Failed to raid player");
      }

      return response.json();
    },
  });

  const defendMutation = useMutation({
    mutationFn: async ({ battleId }: { battleId: string }) => {
      const response = await fetch(`${API_URL}/battles/${battleId}/accept`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status !== 201) {
        throw new Error("Failed to defend battle");
      }

      return response.json();
    },
  });

  return {
    raid: raidMutation.mutateAsync,
    defend: defendMutation.mutateAsync,
  };
};
