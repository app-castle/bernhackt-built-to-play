import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { usePlayers, useRaid } from "@/hooks/battle";
import { usePet } from "@/hooks/pet";
import { useBattleEvents } from "@/hooks/useBattleEvents";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { NavLink } from "react-router-dom";

function PetPage() {
  const { pet, isLoading, error, refetch, train } = usePet();
  const [clickCount, setClickCount] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const { players } = usePlayers();
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

  const playerSelection = players?.map(
    (p) => ({ label: p.name, value: p.id }) as const,
  );

  const handleTrainClick = () => {
    // Increment click counter
    setClickCount((prev) => prev + 1);

    // Clear previous timer if exists
    if (timer.current) {
      clearTimeout(timer.current);
    }

    // Set new timer to clear after 2 seconds
    timer.current = setTimeout(() => {
      train(clickCount + 1);
      setClickCount(0);
    }, 1000);
  };

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>No Pet Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You don't have a pet yet.</p>
            <NavLink
              to="/"
              className={cn(buttonVariants({ variant: "outline" }), "mt-4")}
            >
              Create Pet
            </NavLink>
          </CardContent>
        </Card>
      </div>
    );
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

                <Button variant="outline" onClick={handleTrainClick}>
                  Train {clickCount > 0 ? `(+${clickCount} EXP)` : ""}
                </Button>

                {playerSelection && playerSelection.length > 0 && (
                  <ButtonGroup>
                    <Select
                      items={playerSelection}
                      onValueChange={(value) => setSelectedPlayer(value)}
                      value={selectedPlayer || null}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Player" />
                      </SelectTrigger>
                      <SelectContent>
                        {playerSelection.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      disabled={!selectedPlayer}
                      onClick={() => raid({ defenderPetId: selectedPlayer! })}
                    >
                      Raid
                    </Button>
                  </ButtonGroup>
                )}
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
