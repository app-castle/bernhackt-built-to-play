import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { usePet } from "@/hooks/usePet";
import { SubmitEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [petName, setPetName] = useState("");
  const { createPet, isCreating } = usePet();

  const handleSubmit: SubmitEventHandler = (e) => {
    e.preventDefault();

    const trimmedName = petName.trim();

    if (!trimmedName) return;

    createPet({ name: trimmedName })
      .then((pet) => {
        navigate(`/pet/${pet.id}`);
      })
      .catch((error) => {
        console.error("Failed to create pet:", error);
      });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Name your pet</CardTitle>
          <CardDescription>
            Enter a name for your pet to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="pet-name" className="text-sm font-medium">
                Pet name
              </label>
              <Input
                id="pet-name"
                value={petName}
                onChange={(e) => setPetName(e.target.value)}
                placeholder="Enter your pet's name"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!petName.trim() || isCreating}
            >
              {isCreating ? "Creating..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
