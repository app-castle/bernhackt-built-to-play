import { Button } from "@/components/ui/button";
import { usePet } from "@/hooks/pet";
import { useRef, useState } from "react";

export const TrainButton = () => {
  const { train } = usePet();
  const [clickCount, setClickCount] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <Button variant="outline" onClick={handleTrainClick}>
      Train {clickCount > 0 ? `(+${clickCount} EXP)` : ""}
    </Button>
  );
};
