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
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function PetPage() {
  const { pet, isLoading, error, refetch } = usePet();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const { raid, defend } = useRaid();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">Failed to load pet: {error.message}</p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

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

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => refetch()}>
                  Refresh
                </Button>

                <TrainButton />

                <ButtonGroup>
                  <PlayerSelection
                    selectedPlayer={selectedPlayer}
                    onPlayerSelect={setSelectedPlayer}
                  />
                  <Button
                    disabled={!selectedPlayer}
                    onClick={() => raid({ defenderPetId: selectedPlayer! })}
                  >
                    Raid
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

export default PetPage;
