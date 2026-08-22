import { API_URL } from "@/lib/api";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

interface Pet {
  name: string;
  xp: number;
  level: number;
  defense: number;
  attack: number;
  health: number;
  status: {
    state: "available" | "raiding" | "pet_sitting" | "tired";
    availableAt: Date | null;
  };
}

export function usePet() {
  const queryClient = useQueryClient();

  const petQuery = useSuspenseQuery<Pet>({
    queryKey: ["pet"],
    queryFn: async () => {
      const accessToken = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/pets/me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.status !== 200) {
        throw new Error("Failed to fetch pet");
      }

      return response.json();
    },
  });

  const trainMutation = useMutation({
    mutationFn: async (intensity: number) => {
      const accessToken = localStorage.getItem("accessToken");

      const response = await fetch(`${API_URL}/pets/training`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
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
    refetch: petQuery.refetch,
    train: trainMutation.mutateAsync,
    isTraining: trainMutation.isPending,
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
      localStorage.setItem("accessToken", accessToken);
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
