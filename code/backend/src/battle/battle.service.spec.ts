import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PetActivityService } from '../pet-activity/pet-activity.service';
import { PetEventsService } from '../pet/pet-events.service';
import { PetService } from '../pet/pet.service';
import { Pet } from '../pet/entities/pet.entity';
import { PetTemplate } from '../pet/templates/pet-template.interface';
import { BattleService } from './battle.service';
import { BattleEventsService } from './battle-events.service';
import { BattleTemplate } from './config/battle-template.interface';
import { Battle, BattleStatus } from './entities/battle.entity';

const testPetTemplate: PetTemplate = {
  health: 100,
  attack: 10,
  defense: 5,
  healthGrowth: 0,
  attackGrowth: 0,
  defenseGrowth: 0,
  tiredDebuff: 0.3,
};

const testBattleTemplate: BattleTemplate = {
  reactionWindowMs: 15_000,
  defenseBoost: 0.2,
  defenseMalus: -0.2,
  baseBattleXp: 40,
  levelDiffXpFactor: 0.05,
  minXpMultiplier: 0.25,
  maxXpMultiplier: 2.5,
  raidTiredMs: 5 * 60_000,
};

function makePet(overrides: Partial<Pet>): Pet {
  return {
    id: 'pet-id',
    name: 'Pet',
    attack: 10,
    defense: 5,
    health: 100,
    xp: 0,
    level: 1,
    lastTrainedAt: null,
    dailyKeystrokes: 0,
    dailyKeystrokesDate: null,
    tiredUntil: null,
    lastQuestDate: null,
    accessToken: 'token',
    ...overrides,
  };
}

function makeBattle(overrides: Partial<Battle>): Battle {
  return {
    id: 'battle-id',
    challengerPetId: 'challenger-1',
    challenger: undefined as unknown as Pet,
    defenderPetId: 'defender-1',
    defender: undefined as unknown as Pet,
    status: BattleStatus.PENDING,
    defended: false,
    winnerPetId: null,
    winner: null,
    levelDifference: 0,
    challengerXpChange: null,
    defenderXpChange: null,
    createdAt: new Date(),
    resolvedAt: null,
    ...overrides,
  };
}

describe('BattleService', () => {
  let challenger: Pet;
  let defender: Pet;
  let petRepository: { findOneBy: jest.Mock; find: jest.Mock };
  let petService: PetService;
  let battleRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOneBy: jest.Mock;
  };
  let manager: {
    findOne: jest.Mock;
    findOneByOrFail: jest.Mock;
    save: jest.Mock;
  };
  let dataSource: { transaction: jest.Mock };
  let battleEventsService: {
    emitChallenge: jest.Mock;
    emitResolved: jest.Mock;
  };
  let petActivityService: {
    isInActiveBattle: jest.Mock;
    isPetSittingBusy: jest.Mock;
    getStatus: jest.Mock;
    isAvailable: jest.Mock;
    isTired: jest.Mock;
  };
  let battleService: BattleService;

  beforeEach(() => {
    petActivityService = {
      isInActiveBattle: jest.fn().mockResolvedValue(false),
      isPetSittingBusy: jest.fn().mockResolvedValue(false),
      getStatus: jest.fn(),
      isAvailable: jest.fn().mockResolvedValue(true),
      isTired: jest.fn(
        (pet: Pet) => !!pet.tiredUntil && pet.tiredUntil.getTime() > Date.now(),
      ),
    };

    challenger = makePet({
      id: 'challenger-1',
      accessToken: 'challenger-token',
      attack: 20,
      defense: 5,
      health: 50,
      level: 5,
      xp: 0,
    });
    defender = makePet({
      id: 'defender-1',
      accessToken: 'defender-token',
      attack: 5,
      defense: 20,
      health: 50,
      level: 5,
      xp: 10,
    });

    petRepository = { findOneBy: jest.fn(), find: jest.fn() };
    petRepository.findOneBy.mockImplementation(({ id, accessToken }) => {
      if (id === challenger.id || accessToken === challenger.accessToken)
        return challenger;
      if (id === defender.id || accessToken === defender.accessToken)
        return defender;
      return null;
    });
    petRepository.find.mockImplementation(() => [challenger, defender]);

    petService = new PetService(
      petRepository as unknown as Repository<Pet>,
      testPetTemplate,
      { emitTrained: jest.fn() } as unknown as PetEventsService,
      petActivityService as unknown as PetActivityService,
    );

    battleRepository = {
      create: jest.fn((data: Partial<Battle>) => ({
        ...makeBattle({}),
        ...data,
      })),
      save: jest.fn((battle) => Promise.resolve(battle)),
      find: jest.fn(),
      findOneBy: jest.fn(),
    };

    manager = {
      findOne: jest.fn(),
      findOneByOrFail: jest.fn((_entity: unknown, where: { id: string }) => {
        if (where.id === challenger.id) return Promise.resolve(challenger);
        if (where.id === defender.id) return Promise.resolve(defender);
        return Promise.reject(new Error('not found'));
      }),
      save: jest.fn((_entity, data) => Promise.resolve(data)),
    };

    dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
    };

    battleEventsService = { emitChallenge: jest.fn(), emitResolved: jest.fn() };

    battleService = new BattleService(
      battleRepository as unknown as Repository<Battle>,
      dataSource as unknown as DataSource,
      petService,
      petActivityService as unknown as PetActivityService,
      battleEventsService as unknown as BattleEventsService,
      testBattleTemplate,
    );
  });

  describe('challenge', () => {
    it('rejects challenging yourself', async () => {
      battleRepository.find.mockResolvedValue([]);

      await expect(
        battleService.challenge(challenger.accessToken, {
          defenderPetId: challenger.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the challenger is already in a battle', async () => {
      battleRepository.find.mockResolvedValueOnce([
        makeBattle({ status: BattleStatus.PENDING }),
      ]);

      await expect(
        battleService.challenge(challenger.accessToken, {
          defenderPetId: defender.id,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects when the defender is already in a battle', async () => {
      battleRepository.find
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([makeBattle({ status: BattleStatus.PENDING })]);

      await expect(
        battleService.challenge(challenger.accessToken, {
          defenderPetId: defender.id,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects when the challenger is busy pet sitting', async () => {
      battleRepository.find.mockResolvedValue([]);
      petActivityService.isPetSittingBusy.mockResolvedValueOnce(true);

      await expect(
        battleService.challenge(challenger.accessToken, {
          defenderPetId: defender.id,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects when the challenger is tired', async () => {
      battleRepository.find.mockResolvedValue([]);
      challenger.tiredUntil = new Date(Date.now() + 60_000);

      await expect(
        battleService.challenge(challenger.accessToken, {
          defenderPetId: defender.id,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('allows challenging a tired defender', async () => {
      battleRepository.find.mockResolvedValue([]);
      defender.tiredUntil = new Date(Date.now() + 60_000);
      const setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation(() => 0 as unknown as NodeJS.Timeout);

      const result = await battleService.challenge(challenger.accessToken, {
        defenderPetId: defender.id,
      });

      expect(result.status).toBe(BattleStatus.PENDING);

      setTimeoutSpy.mockRestore();
    });

    it('creates a pending battle and emits an SSE challenge event', async () => {
      battleRepository.find.mockResolvedValue([]);
      // avoid leaving a real 15s timer running past the end of the test
      const setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation(() => 0 as unknown as NodeJS.Timeout);

      const result = await battleService.challenge(challenger.accessToken, {
        defenderPetId: defender.id,
      });

      expect(result.status).toBe(BattleStatus.PENDING);
      expect(result.levelDifference).toBe(challenger.level - defender.level);
      expect(battleEventsService.emitChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          defenderPetId: defender.id,
          challengerPetId: challenger.id,
        }),
      );

      setTimeoutSpy.mockRestore();
    });
  });

  describe('resolve via accept()', () => {
    it('applies the defense boost and lets the defender win a fight it would otherwise lose', async () => {
      const battle = makeBattle({
        createdAt: new Date(),
        status: BattleStatus.PENDING,
      });
      battleRepository.findOneBy.mockResolvedValue(battle);
      manager.findOne.mockResolvedValue(battle);

      const result = await battleService.accept(
        defender.accessToken,
        battle.id,
      );

      expect(result.defended).toBe(true);
      expect(result.winnerPetId).toBe(defender.id);
      expect(result.challengerXpChange).toBeLessThan(0);
      expect(result.defenderXpChange).toBeGreaterThan(0);
      expect(defender.xp).toBe(10 + 40);
      expect(challenger.xp).toBe(0);

      expect(battleEventsService.emitResolved).toHaveBeenCalledTimes(1);
      expect(battleEventsService.emitResolved).toHaveBeenCalledWith(
        expect.objectContaining({
          battleId: battle.id,
          winnerPetId: defender.id,
          defended: true,
        }),
      );
    });

    it('sets tiredUntil on both pets after resolving', async () => {
      const battle = makeBattle({
        createdAt: new Date(),
        status: BattleStatus.PENDING,
      });
      battleRepository.findOneBy.mockResolvedValue(battle);
      manager.findOne.mockResolvedValue(battle);

      const before = Date.now();
      await battleService.accept(defender.accessToken, battle.id);

      expect(challenger.tiredUntil).not.toBeNull();
      expect(defender.tiredUntil).not.toBeNull();
      expect(challenger.tiredUntil!.getTime()).toBeGreaterThanOrEqual(
        before + testBattleTemplate.raidTiredMs,
      );
      expect(defender.tiredUntil!.getTime()).toBe(
        challenger.tiredUntil!.getTime(),
      );
    });

    it('applies the tiredness debuff to a tired defender, letting the challenger win despite the defense boost', async () => {
      defender.tiredUntil = new Date(Date.now() + 60_000);
      const battle = makeBattle({
        createdAt: new Date(),
        status: BattleStatus.PENDING,
      });
      battleRepository.findOneBy.mockResolvedValue(battle);
      manager.findOne.mockResolvedValue(battle);

      const result = await battleService.accept(
        defender.accessToken,
        battle.id,
      );

      expect(result.defended).toBe(true);
      expect(result.winnerPetId).toBe(challenger.id);
    });

    it('does not re-emit battle.resolved when accept() races an already-resolved battle', async () => {
      const battle = makeBattle({
        createdAt: new Date(),
        status: BattleStatus.PENDING,
      });
      battleRepository.findOneBy.mockResolvedValue(battle);
      // simulate the timeout callback having already resolved it inside the transaction
      manager.findOne.mockResolvedValue({
        ...battle,
        status: BattleStatus.RESOLVED,
      });

      await battleService.accept(defender.accessToken, battle.id);

      expect(battleEventsService.emitResolved).not.toHaveBeenCalled();
    });

    it('rejects when the caller is not the defender', async () => {
      const battle = makeBattle({
        createdAt: new Date(),
        status: BattleStatus.PENDING,
      });
      battleRepository.findOneBy.mockResolvedValue(battle);

      await expect(
        battleService.accept(challenger.accessToken, battle.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects accepting a battle that already resolved', async () => {
      const battle = makeBattle({ status: BattleStatus.RESOLVED });
      battleRepository.findOneBy.mockResolvedValue(battle);

      await expect(
        battleService.accept(defender.accessToken, battle.id),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('lazy expiry resolution', () => {
    it('applies the defense malus and floors XP loss at zero when the window elapses unanswered', async () => {
      const battle = makeBattle({
        createdAt: new Date(Date.now() - 20_000),
        status: BattleStatus.PENDING,
      });
      battleRepository.findOneBy.mockResolvedValue(battle);
      manager.findOne.mockResolvedValue(battle);

      defender.xp = 10;

      const result = await battleService.getById(
        challenger.accessToken,
        battle.id,
      );

      expect(result.defended).toBe(false);
      expect(result.winnerPetId).toBe(challenger.id);
      expect(challenger.xp).toBe(40);
      expect(defender.xp).toBe(0);

      expect(battleEventsService.emitResolved).toHaveBeenCalledTimes(1);
      expect(battleEventsService.emitResolved).toHaveBeenCalledWith(
        expect.objectContaining({
          battleId: battle.id,
          winnerPetId: challenger.id,
          defended: false,
        }),
      );
    });
  });

  describe('XP scaling by level difference', () => {
    it('shrinks toward the minimum multiplier when the winner was already much stronger', async () => {
      // defender always wins this fixture once defended (see boost test above);
      // making the winner (defender) far higher level than the loser is the "expected win" case.
      challenger.level = 5;
      defender.level = 105;
      const battle = makeBattle({
        createdAt: new Date(),
        status: BattleStatus.PENDING,
      });
      battleRepository.findOneBy.mockResolvedValue(battle);
      manager.findOne.mockResolvedValue(battle);

      const result = await battleService.accept(
        defender.accessToken,
        battle.id,
      );

      // asserting on the reported delta (not the post-level-up pet.xp) keeps this
      // isolated from level-up threshold interactions
      expect(result.defenderXpChange).toBe(40 * 0.25);
      expect(result.challengerXpChange).toBe(-40 * 0.25);
    });

    it('grows toward the maximum multiplier for a large upset', async () => {
      // winner (defender) far lower level than the loser it just beat.
      challenger.level = 105;
      defender.level = 1;
      const battle = makeBattle({
        createdAt: new Date(),
        status: BattleStatus.PENDING,
      });
      battleRepository.findOneBy.mockResolvedValue(battle);
      manager.findOne.mockResolvedValue(battle);

      const result = await battleService.accept(
        defender.accessToken,
        battle.id,
      );

      expect(result.defenderXpChange).toBe(40 * 2.5);
      expect(result.challengerXpChange).toBe(-40 * 2.5);
    });
  });
});
