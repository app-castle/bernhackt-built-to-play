import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePet } from "@/hooks/pet";
import { cn } from "@/lib/utils";
import { NavLink } from "react-router-dom";

function PetPage() {
  const { pet, isLoading, error, refetch } = usePet();

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
              <p className="text-sm text-muted-foreground">Level 1</p>
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
