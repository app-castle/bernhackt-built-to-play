import { PetAvatar } from "@/components/PetAvatar";
import { PlayerSelection } from "@/components/PlayerSelection";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { useRaid } from "@/hooks/battle";
import { usePet } from "@/hooks/pet";
import { useBattleEvents } from "@/hooks/useBattleEvents";
import { useKeystrokeListener } from "@/hooks/useKeystrokeListener";
import { usePetSitting } from "@/hooks/usePetSitting";
import { usePetSittingEvents } from "@/hooks/usePetSittingEvents";
import { useQueryClient } from "@tanstack/react-query";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { HeartIcon, ShieldIcon, SwordIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

function Pet() {
  const { pet, trainPet } = usePet();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const letterRef = useRef<HTMLInputElement>(null);
  const { raid, defend } = useRaid();
  const { sendPet, acceptPetSitting } = usePetSitting();

  useKeystrokeListener({
    onKeystrokeBatch: trainPet,
  });

  usePetSittingEvents({
    petSittingInvited: (data) => {
      console.log("Pet sitting invited event received:", data);
      const id = toast.add({
        title: `${data.senderName} would like to stay at your place!`,
        description: data.letter,
        timeout: data.expiresAt.getTime() - Date.now(),
        actionProps: {
          children: "Accept",
          onClick: () => {
            acceptPetSitting(data.petSittingId);
            toast.close(id);
          },
        },
      });
    },
    petSittingStarted: (data) => {
      console.log("Pet sitting started event received:", data);
      queryClient.invalidateQueries({ queryKey: ["pet"] });
    },
    petSittingEnded: (data) => {
      (console.log("Pet sitting ended event received:", data),
        queryClient.invalidateQueries({ queryKey: ["pet"] }));
    },
  });

  const queryClient = useQueryClient();

  useBattleEvents({
    onBattleChallenged: (data) => {
      console.log("Battle challenged event received:", data);
      const id = toast.add({
        title: `${data.challengerName} is raiding you!`,
        timeout: data.expiresAt.getTime() - Date.now(),
        actionProps: {
          children: "Defend",
          onClick: () => {
            defend({ battleId: data.battleId });
            toast.close(id);
          },
        },
      });
    },
    onBattleResolved: (data) => {
      console.log("Battle resolved event received:", data);
      queryClient.invalidateQueries({ queryKey: ["pet"] });
    },
  });

  if (!pet) {
    throw new Error("Pet data is not available");
  }

  const handlePointerDown = async () => {
    if (!isTauri()) return;

    const window = getCurrentWindow();
    await window.startDragging();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-4">
          <PetAvatar
            name={pet.name}
            state={pet.status.state}
            className="h-20 w-20"
            onPointerDown={handlePointerDown}
          />
          <div className="space-y-1">
            <CardTitle className="text-xl">{pet.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Level {pet.level}</p>
            <Badge>{pet.status.state}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-3 justify-center">
          <Badge className="flex gap-1.5 justify-between min-w-20 h-8 px-3 text-sm [&>svg]:size-4! bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
            <span>XP</span>
            {pet.xp}
          </Badge>
          <Badge className="flex gap-1.5 justify-between min-w-20 h-8 px-3 text-sm [&>svg]:size-4! bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300">
            <SwordIcon />
            {pet.attack}
          </Badge>
          <Badge className="flex gap-1.5 justify-between min-w-20 h-8 px-3 text-sm [&>svg]:size-4! bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
            <ShieldIcon />
            {pet.defense}
          </Badge>
          <Badge className="flex gap-1.5 justify-between min-w-20 h-8 px-3 text-sm [&>svg]:size-4! bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300">
            <HeartIcon />
            {pet.health}
          </Badge>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col gap-2">
          <PlayerSelection
            className="w-auto"
            selectedPlayer={selectedPlayer}
            onPlayerSelect={setSelectedPlayer}
          />

          <Input type="text" placeholder="Letter ..." ref={letterRef} />

          <div className="grid grid-cols-2 gap-2">
            <Button
              disabled={!selectedPlayer}
              onClick={() => {
                raid({ defenderPetId: selectedPlayer! });

                if (letterRef.current) {
                  letterRef.current.value = "";
                }
              }}
            >
              Raid
            </Button>
            <Button
              disabled={!selectedPlayer}
              onClick={() => {
                sendPet({
                  hostPetId: selectedPlayer!,
                  letter:
                    letterRef.current?.value || "Please take care of my pet!",
                });

                if (letterRef.current) {
                  letterRef.current.value = "";
                }
              }}
            >
              Send Pet
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default Pet;
