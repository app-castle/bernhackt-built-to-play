import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CreatePetDto {
  name: string;
}

export interface Pet {
  id: string;
  name: string;
  status: string;
  image?: string;
  createdAt: string;
}

export function usePet() {
  const queryClient = useQueryClient();

  const createPetMutation = useMutation({
    mutationFn: async (data: CreatePetDto): Promise<Pet> => {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:3000/pets', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // return response.json();

      // Mock implementation
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        id: Date.now().toString(),
        name: data.name,
        status: "New",
        createdAt: new Date().toISOString(),
      };
    },
    onSuccess: (_data) => {
      // Invalidate and refetch pets list
      queryClient.invalidateQueries({ queryKey: ["pets"] });
    },
    onError: (error) => {
      console.error("Failed to create pet:", error);
    },
  });

  return {
    createPet: createPetMutation.mutateAsync,
    isCreating: createPetMutation.isPending,
  };
}
