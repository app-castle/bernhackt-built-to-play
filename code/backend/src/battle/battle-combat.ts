import { BattleTemplate } from './config/battle-template.interface';

export interface CombatStats {
  attack: number;
  defense: number;
  health: number;
  level: number;
}

export interface CombatOutcome {
  challengerWins: boolean;
  xpAmount: number;
}

export function computeBattleOutcome(
  challenger: CombatStats,
  defender: CombatStats,
  defended: boolean,
  template: BattleTemplate,
): CombatOutcome {
  const defenderModifier = defended
    ? template.defenseBoost
    : template.defenseMalus;

  const challengerScore =
    challenger.attack +
    challenger.health -
    defender.defense * (1 + defenderModifier);
  const defenderScore = defender.attack + defender.health - challenger.defense;

  const challengerWins = pickWinner(
    challengerScore,
    defenderScore,
    challenger,
    defender,
  );

  const winner = challengerWins ? challenger : defender;
  const loser = challengerWins ? defender : challenger;

  const levelGap = winner.level - loser.level;
  const multiplier = clamp(
    1 - template.levelDiffXpFactor * levelGap,
    template.minXpMultiplier,
    template.maxXpMultiplier,
  );
  const xpAmount = template.baseBattleXp * multiplier;

  return { challengerWins, xpAmount };
}

export function pickWinner(
  challengerScore: number,
  defenderScore: number,
  challenger: CombatStats,
  defender: CombatStats,
): boolean {
  if (challengerScore !== defenderScore) {
    return challengerScore > defenderScore;
  }
  if (challenger.health !== defender.health) {
    return challenger.health > defender.health;
  }
  if (challenger.level !== defender.level) {
    return challenger.level > defender.level;
  }
  return true;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
