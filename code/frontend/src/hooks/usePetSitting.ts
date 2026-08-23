import { API_URL } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { useToken } from "./useToken";

interface CreatePetSittingDto {
  hostPetId: string;
  letter: string;
}

export const usePetSitting = () => {
  const { token } = useToken();

  const sendPetMutation = useMutation({
    mutationFn: async (data: CreatePetSittingDto) => {
      const response = await fetch(`${API_URL}/pet-sitting`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (response.status !== 201) {
        throw new Error("Failed to send pet for sitting");
      }
      return response.json();
    },
  });

  const acceptPetSittingMutation = useMutation({
    mutationFn: async (petSittingId: string) => {
      const response = await fetch(
        `${API_URL}/pet-sitting/${petSittingId}/accept`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.status !== 201) {
        throw new Error("Failed to accept pet sitting invitation");
      }
      return response.json();
    },
  });

  return {
    sendPet: sendPetMutation.mutateAsync,
    acceptPetSitting: acceptPetSittingMutation.mutateAsync,
  };
};
