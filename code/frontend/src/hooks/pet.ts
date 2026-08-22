import { API_URL } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface Pet {
  name: string;
  xp: number;
  defense: number;
  attack: number;
  health: number;
  accessToken: string;
}

export function usePet() {
  const petQuery = useQuery<Pet>({
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

  return {
    pet: petQuery.data,
    isLoading: petQuery.isLoading,
    error: petQuery.error,
    refetch: petQuery.refetch,
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
