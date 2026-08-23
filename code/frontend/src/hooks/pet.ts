import { API_URL } from "@/lib/api";
import { PetSittingStatus } from "@/lib/types";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useToken } from "./useToken";

interface Pet {
  name: string;
  xp: number;
  level: number;
  defense: number;
  attack: number;
  health: number;
  status: PetSittingStatus;
}

export function usePet() {
  const queryClient = useQueryClient();

  const { token } = useToken();

  const petQuery = useSuspenseQuery<Pet>({
    queryKey: ["pet"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/pets/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status !== 200) {
        throw new Error("Failed to fetch pet");
      }

      return response.json();
    },
  });

  const trainPetMutation = useMutation({
    mutationFn: async (intensity: number) => {
      const response = await fetch(`${API_URL}/pets/training`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ intensity }),
      });

      if (response.status !== 201) {
        throw new Error("Failed to train pet");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch pet
      queryClient.invalidateQueries({ queryKey: ["pet"] });
    },
  });

  return {
    pet: petQuery.data,
    trainPet: trainPetMutation.mutateAsync,
  };
}

interface CreatePetDto {
  name: string;
}

interface ReturnCreatePetDto {
  accessToken: string;
}

export const useCreatePet = () => {
  const queryClient = useQueryClient();

  const { setToken } = useToken();

  const createPetMutation = useMutation({
    mutationFn: async (data: CreatePetDto) => {
      const response = await fetch(`${API_URL}/pets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.status !== 201) {
        throw new Error("Failed to create pet");
      }

      const { accessToken } = (await response.json()) as ReturnCreatePetDto;
      setToken(accessToken);
    },
    onSuccess: () => {
      // Invalidate and refetch pet
      queryClient.invalidateQueries({ queryKey: ["pet"] });
    },
  });

  return {
    createPet: createPetMutation.mutateAsync,
    isPending: createPetMutation.isPending,
  };
};
