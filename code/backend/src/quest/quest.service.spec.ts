import { BadRequestException, HttpException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { getServerDateKey } from '../common/server-date.util';
import { Pet } from '../pet/entities/pet.entity';
import { PetActivityService } from '../pet-activity/pet-activity.service';
import { PetEventsService } from '../pet/pet-events.service';
import { PetService } from '../pet/pet.service';
import { PetTemplate } from '../pet/templates/pet-template.interface';
import { QuestTemplate } from './config/quest-template.interface';
import { Quest } from './entities/quest.entity';
import { QuestAiService } from './quest-ai.service';
import * as questReward from './quest-reward';
import { QuestService } from './quest.service';

const testPetTemplate: PetTemplate = {
  health: 100,
  attack: 10,
  defense: 5,
  healthGrowth: 0,
  attackGrowth: 0,
  defenseGrowth: 0,
  tiredDebuff: 0.3,
};

const testQuestTemplate: QuestTemplate = {
  healthRewardFloor: 2,
  healthRewardMax: 20,
  attackRewardFloor: 1,
  attackRewardMax: 8,
  defenseRewardFloor: 0.5,
  defenseRewardMax: 4,
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

function makeQuest(overrides: Partial<Quest>): Quest {
  return {
    id: 'quest-id',
    petId: 'pet-id',
    pet: undefined as unknown as Pet,
    kind: 'pirate',
    words: ['treasure', 'storm', 'brave'],
    outcomeText: 'A fine tale.',
    outcomeScore: 80,
    rewardedStat: 'attack',
    rewardAmount: 5,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('QuestService', () => {
  let pet: Pet;
  let petService: PetService;
  let petRepository: { findOneBy: jest.Mock };
  let petActivityService: { isTired: jest.Mock };
  let questRepository: { create: jest.Mock; save: jest.Mock; find: jest.Mock };
  let manager: { save: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let questAiService: { generateOutcome: jest.Mock };
  let questService: QuestService;

  beforeEach(() => {
    jest.restoreAllMocks();

    pet = makePet({});

    petActivityService = { isTired: jest.fn().mockReturnValue(false) };
    petRepository = { findOneBy: jest.fn().mockImplementation(() => pet) };

    petService = new PetService(
      petRepository as unknown as Repository<Pet>,
      testPetTemplate,
      { emitTrained: jest.fn() } as unknown as PetEventsService,
      petActivityService as unknown as PetActivityService,
    );

    questRepository = {
      create: jest.fn((data: Partial<Quest>) => ({
        ...makeQuest({}),
        ...data,
      })),
      save: jest.fn((quest) => Promise.resolve(quest)),
      find: jest.fn(),
    };

    manager = { save: jest.fn((_entity, data) => Promise.resolve(data)) };
    dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
    };

    questAiService = { generateOutcome: jest.fn() };

    questService = new QuestService(
      questRepository as unknown as Repository<Quest>,
      dataSource as unknown as DataSource,
      petService,
      questAiService as unknown as QuestAiService,
      testQuestTemplate,
    );
  });

  describe('suggest', () => {
    it('returns 3 suggestions, each with 3 words, all drawn from the fixed lists', async () => {
      const result = await questService.suggest(pet.accessToken);

      expect(result.suggestions).toHaveLength(3);
      for (const suggestion of result.suggestions) {
        expect(suggestion.words).toHaveLength(3);
      }
    });
  });

  describe('select', () => {
    it('throws BadRequestException for an unknown quest kind', async () => {
      await expect(
        questService.select(pet.accessToken, {
          kind: 'not-a-kind' as never,
          words: ['treasure', 'storm', 'brave'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException for an unknown word', async () => {
      await expect(
        questService.select(pet.accessToken, {
          kind: 'pirate',
          words: ['treasure', 'storm', 'not-a-word'],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws 429 when the pet already quested today', async () => {
      pet.lastQuestDate = getServerDateKey(new Date());

      await expect(
        questService.select(pet.accessToken, {
          kind: 'pirate',
          words: ['treasure', 'storm', 'brave'],
        }),
      ).rejects.toThrow(HttpException);
    });

    it('increases the picked stat by exactly the computed reward and saves both entities', async () => {
      jest.spyOn(questReward, 'pickRewardStat').mockReturnValue('attack');
      questAiService.generateOutcome.mockResolvedValue({
        narrative: 'A fine tale.',
        outcomeScore: 100,
      });

      const result = await questService.select(pet.accessToken, {
        kind: 'pirate',
        words: ['treasure', 'storm', 'brave'],
      });

      expect(pet.attack).toBe(10 + testQuestTemplate.attackRewardMax);
      expect(pet.lastQuestDate).toBe(getServerDateKey(new Date()));
      expect(questRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          rewardedStat: 'attack',
          rewardAmount: testQuestTemplate.attackRewardMax,
        }),
      );
      expect(manager.save).toHaveBeenCalledTimes(2);
      expect(result.rewardedStat).toBe('attack');
      expect(result.rewardAmount).toBe(testQuestTemplate.attackRewardMax);
    });

    it('clamps an out-of-range AI score before computing the reward', async () => {
      jest.spyOn(questReward, 'pickRewardStat').mockReturnValue('health');
      questAiService.generateOutcome.mockResolvedValue({
        narrative: 'Too good to be true.',
        outcomeScore: 150,
      });

      await questService.select(pet.accessToken, {
        kind: 'pirate',
        words: ['treasure', 'storm', 'brave'],
      });

      expect(pet.health).toBe(100 + testQuestTemplate.healthRewardMax);
    });

    it('returns 502 and does not consume the cooldown when the AI call fails', async () => {
      questAiService.generateOutcome.mockRejectedValue(new Error('boom'));

      await expect(
        questService.select(pet.accessToken, {
          kind: 'pirate',
          words: ['treasure', 'storm', 'brave'],
        }),
      ).rejects.toThrow(HttpException);

      expect(pet.lastQuestDate).toBeNull();
      expect(pet.attack).toBe(10);
      expect(questRepository.save).not.toHaveBeenCalled();
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('listMine', () => {
    it('returns the pet quest history ordered by the repository', async () => {
      questRepository.find.mockResolvedValue([makeQuest({})]);

      const result = await questService.listMine(pet.accessToken);

      expect(result).toHaveLength(1);
      expect(questRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { petId: pet.id } }),
      );
    });
  });
});
