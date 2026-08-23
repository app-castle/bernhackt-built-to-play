import { API_URL } from "@/lib/api";
import { useEffect } from "react";
import { useToken } from "./useToken";

interface PetSittingInvited {
  petSittingId: string;
  senderPetId: string;
  senderName: string;
  hostPetId: string;
  letter: string;
  expiresAt: Date;
}

interface PetSittingStarted {
  petSittingId: string;
  senderPetId: string;
  hostPetId: string;
  startedAt: Date;
  endsAt: Date;
}

interface PetSittingEnded {
  petSittingId: string;
  senderPetId: string;
  hostPetId: string;
  endedAt: Date;
}

export const usePetSittingEvents = ({
  petSittingInvited,
  petSittingStarted,
  petSittingEnded,
}: {
  petSittingInvited?: (data: PetSittingInvited) => void;
  petSittingStarted?: (data: PetSittingStarted) => void;
  petSittingEnded?: (data: PetSittingEnded) => void;
} = {}) => {
  const { token } = useToken();

  useEffect(() => {
    const eventSource = new EventSource(
      `${API_URL}/pet-sitting/events?token=${token}`,
    );

    const abortController = new AbortController();

    if (petSittingInvited) {
      eventSource.addEventListener(
        "pet-sitting.invited",
        (event) => {
          const rawData = JSON.parse(event.data);

          petSittingInvited({
            ...rawData,
            expiresAt: new Date(rawData.expiresAt),
          });
        },
        { signal: abortController.signal },
      );
    }

    if (petSittingStarted) {
      eventSource.addEventListener(
        "pet-sitting.started",
        (event) => {
          const rawData = JSON.parse(event.data);

          petSittingStarted({
            ...rawData,
            startedAt: new Date(rawData.startedAt),
            endsAt: new Date(rawData.endsAt),
          });
        },
        { signal: abortController.signal },
      );
    }

    if (petSittingEnded) {
      eventSource.addEventListener(
        "pet-sitting.ended",
        (event) => {
          const rawData = JSON.parse(event.data);

          petSittingEnded({
            ...rawData,
            endedAt: new Date(rawData.endedAt),
          });
        },
        { signal: abortController.signal },
      );
    }

    return () => {
      abortController.abort();
      eventSource.close();
    };
  }, [petSittingInvited, petSittingStarted, petSittingEnded]);
};
