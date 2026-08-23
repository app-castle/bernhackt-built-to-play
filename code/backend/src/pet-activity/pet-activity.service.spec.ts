import { Repository } from 'typeorm';
import { BattleTemplate } from '../battle/config/battle-template.interface';
import { Battle, BattleStatus } from '../battle/entities/battle.entity';
import { Pet } from '../pet/entities/pet.entity';
import { PetSittingTemplate } from '../pet-sitting/config/pet-sitting-template.interface';
import {
  PetSitting,
  PetSittingStatus,
} from '../pet-sitting/entities/pet-sitting.entity';
import { PetActivityService } from './pet-activity.service';

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

const testPetSittingTemplate: PetSittingTemplate = {
  inviteExpiryMs: 5 * 60_000,
  sessionDurationMs: 60 * 60_000,
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

describe('PetActivityService', () => {
  let battleRepository: { find: jest.Mock };
  let petSittingRepository: { find: jest.Mock };
  let service: PetActivityService;

  beforeEach(() => {
    battleRepository = { find: jest.fn().mockResolvedValue([]) };
    petSittingRepository = { find: jest.fn().mockResolvedValue([]) };

    service = new PetActivityService(
      battleRepository as unknown as Repository<Battle>,
      petSittingRepository as unknown as Repository<PetSitting>,
      testBattleTemplate,
      testPetSittingTemplate,
    );
  });

  describe('isInActiveBattle', () => {
    it('is true for a battle within the reaction window', async () => {
      battleRepository.find.mockResolvedValue([
        { createdAt: new Date(), status: BattleStatus.PENDING },
      ]);

      await expect(service.isInActiveBattle('pet-1')).resolves.toBe(true);
    });

    it('is false once the reaction window has elapsed', async () => {
      battleRepository.find.mockResolvedValue([
        {
          createdAt: new Date(Date.now() - 20_000),
          status: BattleStatus.PENDING,
        },
      ]);

      await expect(service.isInActiveBattle('pet-1')).resolves.toBe(false);
    });
  });

  describe('isPetSittingBusy', () => {
    it('is true for a pending invite within the invite window', async () => {
      petSittingRepository.find.mockResolvedValue([
        { createdAt: new Date(), status: PetSittingStatus.PENDING },
      ]);

      await expect(service.isPetSittingBusy('pet-1')).resolves.toBe(true);
    });

    it('is false once a pending invite has expired', async () => {
      petSittingRepository.find.mockResolvedValue([
        {
          createdAt: new Date(Date.now() - 6 * 60_000),
          status: PetSittingStatus.PENDING,
        },
      ]);

      await expect(service.isPetSittingBusy('pet-1')).resolves.toBe(false);
    });

    it('is true for an active session within the session duration', async () => {
      petSittingRepository.find.mockResolvedValue([
        {
          createdAt: new Date(Date.now() - 60_000),
          acceptedAt: new Date(),
          status: PetSittingStatus.ACTIVE,
        },
      ]);

      await expect(service.isPetSittingBusy('pet-1')).resolves.toBe(true);
    });

    it('is false once an active session has ended', async () => {
      petSittingRepository.find.mockResolvedValue([
        {
          createdAt: new Date(Date.now() - 2 * 60 * 60_000),
          acceptedAt: new Date(Date.now() - 61 * 60_000),
          status: PetSittingStatus.ACTIVE,
        },
      ]);

      await expect(service.isPetSittingBusy('pet-1')).resolves.toBe(false);
    });
  });

  describe('isTired', () => {
    it('is true while tiredUntil is in the future', () => {
      const pet = makePet({ tiredUntil: new Date(Date.now() + 60_000) });

      expect(service.isTired(pet)).toBe(true);
    });

    it('is false once tiredUntil has passed', () => {
      const pet = makePet({ tiredUntil: new Date(Date.now() - 1000) });

      expect(service.isTired(pet)).toBe(false);
    });

    it('is false when tiredUntil is null', () => {
      const pet = makePet({ tiredUntil: null });

      expect(service.isTired(pet)).toBe(false);
    });
  });

  describe('getStatus', () => {
    it('reports tired with availableAt when tiredUntil is in the future', async () => {
      const tiredUntil = new Date(Date.now() + 60_000);
      const pet = makePet({ tiredUntil });

      const status = await service.getStatus(pet);

      expect(status).toEqual({ state: 'tired', availableAt: tiredUntil });
    });

    it('reports available when nothing is active and tiredUntil has passed', async () => {
      const pet = makePet({ tiredUntil: new Date(Date.now() - 1000) });

      const status = await service.getStatus(pet);

      expect(status).toEqual({ state: 'available', availableAt: null });
    });

    it('reports raiding when the pet has an active battle', async () => {
      battleRepository.find.mockResolvedValue([
        { createdAt: new Date(), status: BattleStatus.PENDING },
      ]);
      const pet = makePet({});

      const status = await service.getStatus(pet);

      expect(status).toEqual({ state: 'raiding', availableAt: null });
    });

    it('reports pet_sitting when the pet has an active sitting session', async () => {
      petSittingRepository.find.mockResolvedValue([
        {
          createdAt: new Date(Date.now() - 60_000),
          acceptedAt: new Date(),
          status: PetSittingStatus.ACTIVE,
        },
      ]);
      const pet = makePet({});

      const status = await service.getStatus(pet);

      expect(status).toEqual({ state: 'pet_sitting', availableAt: null });
    });
  });
});
