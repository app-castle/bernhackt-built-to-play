import { QuestTemplate } from './config/quest-template.interface';

export type QuestStat = 'attack' | 'defense' | 'health';

export function clampOutcomeScore(score: number): number {
  if (Number.isNaN(score)) {
    return 0;
  }
  return Math.min(100, Math.max(0, score));
}

export function pickRewardStat(rng: () => number = Math.random): QuestStat {
  const roll = rng();
  if (roll < 1 / 3) {
    return 'attack';
  }
  if (roll < 2 / 3) {
    return 'defense';
  }
  return 'health';
}

export function computeQuestReward(
  stat: QuestStat,
  outcomeScore: number,
  template: QuestTemplate,
): number {
  const clampedScore = clampOutcomeScore(outcomeScore);
  const [floor, max] = {
    attack: [template.attackRewardFloor, template.attackRewardMax],
    defense: [template.defenseRewardFloor, template.defenseRewardMax],
    health: [template.healthRewardFloor, template.healthRewardMax],
  }[stat];

  return floor + (max - floor) * (clampedScore / 100);
}
