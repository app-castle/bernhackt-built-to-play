import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCreatePet } from "@/hooks/pet";
import { SubmitEventHandler, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [petName, setPetName] = useState("");
  const { createPet, isPending } = useCreatePet();

  const handleSubmit: SubmitEventHandler = (e) => {
    e.preventDefault();

    const trimmedName = petName.trim();

    if (!trimmedName) return;

    createPet({ name: trimmedName })
      .then(() => {
        navigate(`/pet`);
      })
      .catch((error) => {
        console.error("Failed to create pet:", error);
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Name your pet</CardTitle>
        <CardDescription>Enter a name for your pet to continue</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="pet-name"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="Hi! My name is ..."
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!petName.trim() || isPending}
          >
            {isPending ? "Creating..." : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
