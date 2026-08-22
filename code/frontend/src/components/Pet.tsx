import { PlayerSelection } from "@/components/PlayerSelection";
import { TrainButton } from "@/components/TrainButton";
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {pet.name[0].toUpperCase() || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-3xl">{pet.name}</CardTitle>
              <p className="text-sm text-muted-foreground">Level {pet.level}</p>
              <Badge>{pet.status.state}</Badge>
            </div>
          </div>
          <Separator className="my-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <>
              <div className="grid grid-cols-2 gap-4">
                <StatCard label="XP" value={pet.xp} />
                <StatCard label="Attack" value={pet.attack} />
                <StatCard label="Defense" value={pet.defense} />
                <StatCard label="Health" value={pet.health} />
              </div>

              <div className="p-4 border rounded-md">
                <p className="text-sm text-muted-foreground">
                  Welcome! Start training your pet to earn experience points.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => refetch()}>
                  Refresh
                </Button>

                <TrainButton />

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
                          letterRef.current?.value ||
                          "Please take care of my pet!",
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
            </>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card className="bg-card/50">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm text-muted-foreground text-center">
        {label}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl font-bold text-center">{value}</p>
    </CardContent>
  </Card>
);

export default Pet;
