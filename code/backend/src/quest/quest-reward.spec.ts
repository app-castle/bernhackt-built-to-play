import { QuestTemplate } from './config/quest-template.interface';
import {
  clampOutcomeScore,
  computeQuestReward,
  pickRewardStat,
} from './quest-reward';

const template: QuestTemplate = {
  healthRewardFloor: 2,
  healthRewardMax: 20,
  attackRewardFloor: 1,
  attackRewardMax: 8,
  defenseRewardFloor: 0.5,
  defenseRewardMax: 4,
};

describe('clampOutcomeScore', () => {
  it('clamps values above 100 down to 100', () => {
    expect(clampOutcomeScore(150)).toBe(100);
  });

  it('clamps values below 0 up to 0', () => {
    expect(clampOutcomeScore(-20)).toBe(0);
  });

  it('treats NaN as 0', () => {
    expect(clampOutcomeScore(NaN)).toBe(0);
  });

  it('passes valid scores through unchanged', () => {
    expect(clampOutcomeScore(73)).toBe(73);
  });
});

describe('pickRewardStat', () => {
  it('returns attack for the bottom third', () => {
    expect(pickRewardStat(() => 0)).toBe('attack');
  });

  it('returns defense for the middle third', () => {
    expect(pickRewardStat(() => 0.34)).toBe('defense');
  });

  it('returns health for the top third', () => {
    expect(pickRewardStat(() => 0.99)).toBe('health');
  });
});

describe('computeQuestReward', () => {
  it.each([
    ['attack', template.attackRewardFloor, template.attackRewardMax],
    ['defense', template.defenseRewardFloor, template.defenseRewardMax],
    ['health', template.healthRewardFloor, template.healthRewardMax],
  ] as const)(
    'returns the floor at score 0, max at 100, and the midpoint at 50 for %s',
    (stat, floor, max) => {
      expect(computeQuestReward(stat, 0, template)).toBe(floor);
      expect(computeQuestReward(stat, 100, template)).toBe(max);
      expect(computeQuestReward(stat, 50, template)).toBeCloseTo(
        floor + (max - floor) / 2,
      );
    },
  );

  it('clamps an out-of-range score before computing the reward', () => {
    expect(computeQuestReward('attack', 150, template)).toBe(
      template.attackRewardMax,
    );
    expect(computeQuestReward('attack', -30, template)).toBe(
      template.attackRewardFloor,
    );
  });
});
