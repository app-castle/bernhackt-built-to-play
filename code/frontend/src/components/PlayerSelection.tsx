import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePlayers } from "@/hooks/battle";

interface PlayerSelectionProps {
  selectedPlayer: string | null;
  onPlayerSelect: (playerId: string | null) => void;
  className?: string;
}

export const PlayerSelection = ({
  selectedPlayer,
  onPlayerSelect,
  className,
}: PlayerSelectionProps) => {
  const { players } = usePlayers();

  const playerSelection = players?.map(
    (p) => ({ label: p.name, value: p.id }) as const,
  );

  return (
    <Select
      items={playerSelection}
      onValueChange={(value) => onPlayerSelect(value)}
      value={selectedPlayer || null}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Player" />
      </SelectTrigger>
      <SelectContent>
        {playerSelection &&
          playerSelection.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};
