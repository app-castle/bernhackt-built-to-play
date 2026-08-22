import { computeBattleOutcome, pickWinner, CombatStats } from './battle-combat';
import { BattleTemplate } from './config/battle-template.interface';

const template: BattleTemplate = {
  reactionWindowMs: 15_000,
  defenseBoost: 0.2,
  defenseMalus: -0.2,
  baseBattleXp: 40,
  levelDiffXpFactor: 0.05,
  minXpMultiplier: 0.25,
  maxXpMultiplier: 2.5,
};

function stats(overrides: Partial<CombatStats>): CombatStats {
  return { attack: 10, defense: 5, health: 100, level: 1, ...overrides };
}

describe('computeBattleOutcome', () => {
  it('gives the challenger the win when the undefended malus weakens the defender enough', () => {
    const challenger = stats({ attack: 20, defense: 5, health: 50 });
    const defender = stats({ attack: 5, defense: 20, health: 50 });

    const outcome = computeBattleOutcome(challenger, defender, false, template);

    expect(outcome.challengerWins).toBe(true);
  });

  it('flips the same matchup in the defender favor once the boost applies', () => {
    const challenger = stats({ attack: 20, defense: 5, health: 50 });
    const defender = stats({ attack: 5, defense: 20, health: 50 });

    const outcome = computeBattleOutcome(challenger, defender, true, template);

    expect(outcome.challengerWins).toBe(false);
  });

  it('keeps the multiplier at 1 (base xp) when winner and loser are the same level', () => {
    const challenger = stats({ attack: 20, health: 50, level: 5 });
    const defender = stats({ attack: 5, health: 10, level: 5 });

    const outcome = computeBattleOutcome(challenger, defender, false, template);

    expect(outcome.xpAmount).toBe(template.baseBattleXp);
  });

  it('clamps to the minimum multiplier for a large expected win', () => {
    const challenger = stats({ attack: 20, health: 50, level: 105 });
    const defender = stats({ attack: 5, health: 10, level: 5 });

    const outcome = computeBattleOutcome(challenger, defender, false, template);

    expect(outcome.challengerWins).toBe(true);
    expect(outcome.xpAmount).toBe(
      template.baseBattleXp * template.minXpMultiplier,
    );
  });

  it('clamps to the maximum multiplier for a large upset', () => {
    const challenger = stats({ attack: 20, health: 50, level: 1 });
    const defender = stats({ attack: 5, health: 10, level: 105 });

    const outcome = computeBattleOutcome(challenger, defender, false, template);

    expect(outcome.challengerWins).toBe(true);
    expect(outcome.xpAmount).toBe(
      template.baseBattleXp * template.maxXpMultiplier,
    );
  });
});

describe('pickWinner tie-break ladder', () => {
  it('falls back to health when scores tie', () => {
    expect(
      pickWinner(50, 50, stats({ health: 40 }), stats({ health: 60 })),
    ).toBe(false);
    expect(
      pickWinner(50, 50, stats({ health: 60 }), stats({ health: 40 })),
    ).toBe(true);
  });

  it('falls back to level when scores and health tie', () => {
    expect(
      pickWinner(
        50,
        50,
        stats({ health: 50, level: 3 }),
        stats({ health: 50, level: 9 }),
      ),
    ).toBe(false);
  });

  it('defaults to the challenger when score, health, and level all tie', () => {
    expect(
      pickWinner(
        50,
        50,
        stats({ health: 50, level: 5 }),
        stats({ health: 50, level: 5 }),
      ),
    ).toBe(true);
  });
});
