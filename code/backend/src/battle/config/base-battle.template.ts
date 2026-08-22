import { BattleTemplate } from './battle-template.interface';

export const baseBattleTemplate: BattleTemplate = {
  reactionWindowMs: 15_000,
  defenseBoost: 0.2,
  defenseMalus: -0.2,
  baseBattleXp: 40,
  levelDiffXpFactor: 0.05,
  minXpMultiplier: 0.25,
  maxXpMultiplier: 2.5,
};
