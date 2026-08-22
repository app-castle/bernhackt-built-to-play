import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { usePet } from "@/hooks/usePet";

function PetPage() {
  usePet();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">?</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">Your Pet</CardTitle>
            </div>
          </div>
          <Separator className="my-4" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-md">
              <p className="text-sm text-muted-foreground">
                Welcome! Start training your pet to earn experience points.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PetPage;
