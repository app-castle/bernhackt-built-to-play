import { PlayerSelection } from "@/components/PlayerSelection";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { useRaid } from "@/hooks/battle";
import { usePet } from "@/hooks/pet";
import { useBattleEvents } from "@/hooks/useBattleEvents";
import { usePetSitting } from "@/hooks/usePetSitting";
import { usePetSittingEvents } from "@/hooks/usePetSittingEvents";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { HeartIcon, ShieldIcon, SwordIcon } from "lucide-react";
import { useRef, useState } from "react";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

function Pet() {
  const { pet, refetch } = usePet();
  const [selectedRaidPlayer, setSelectedRaidPlayer] = useState<string | null>(
    null,
  );
  const [selectedPetSittingPlayer, setSelectedPetSittingPlayer] = useState<
    string | null
  >(null);
  const letterRef = useRef<HTMLInputElement>(null);
  const { raid, defend } = useRaid();
  const { sendPet, acceptPetSitting } = usePetSitting();

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
      toast.add({
        title: `${data.challengerName} is raiding you!`,
        timeout: data.expiresAt.getTime() - Date.now(),
        actionProps: {
          children: "Defend",
          onClick: () => {
            defend({ battleId: data.battleId });
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

  const window = getCurrentWindow();

  const handlePointerDown = async () => {
    await window.startDragging();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20" onPointerDown={handlePointerDown}>
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {pet.name[0].toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <CardTitle className="text-xl">{pet.name}</CardTitle>
            <p className="text-sm text-muted-foreground">Level {pet.level}</p>
            <Badge>{pet.status.state}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Separator className="my-4" />
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge className="flex gap-1 justify-between min-w-15">
            <span>XP</span>
            {pet.xp}
          </Badge>
          <Badge className="flex gap-1 justify-between min-w-15">
            <SwordIcon />
            {pet.attack}
          </Badge>
          <Badge className="flex gap-1 justify-between min-w-15">
            <ShieldIcon />
            {pet.defense}
          </Badge>
          <Badge className="flex gap-1 justify-between min-w-15">
            <HeartIcon />
            {pet.health}
          </Badge>
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            Refresh
          </Button>

          <ButtonGroup>
            <PlayerSelection
              selectedPlayer={selectedRaidPlayer}
              onPlayerSelect={setSelectedRaidPlayer}
            />
            <Button
              disabled={!selectedRaidPlayer}
              onClick={() => raid({ defenderPetId: selectedRaidPlayer! })}
            >
              Raid
            </Button>
          </ButtonGroup>

          <ButtonGroup>
            <Input type="text" placeholder="Letter ..." ref={letterRef} />
            <PlayerSelection
              selectedPlayer={selectedPetSittingPlayer}
              onPlayerSelect={setSelectedPetSittingPlayer}
            />
            <Button
              disabled={!selectedPetSittingPlayer}
              onClick={() => {
                sendPet({
                  hostPetId: selectedPetSittingPlayer!,
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
          </ButtonGroup>
        </div>
      </CardContent>
    </Card>
  );
}

export default Pet;
