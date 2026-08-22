import { API_URL } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CreatePetDto {
  name: string;
}

export interface Pet {
  name: string;
  xp: number;
  defense: number;
  attack: number;
  health: number;
  accessToken: string;
}

export function usePet() {
  const queryClient = useQueryClient();

  const petQuery = useQuery<Pet>({
    queryKey: ["pet"],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/pet`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      return response.json();
    },
  });

  // Create pet mutation
  const createPetMutation = useMutation({
    mutationFn: async (data: CreatePetDto): Promise<Pet> => {
      const response = await fetch(`${API_URL}/api/pet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch pet
      queryClient.invalidateQueries({ queryKey: ["pet"] });
    },
  });

  return {
    pet: petQuery.data,
    isLoading: petQuery.isLoading,
    error: petQuery.error,
    refetch: petQuery.refetch,
    createPet: createPetMutation.mutateAsync,
    isCreating: createPetMutation.isPending,
  };
}
