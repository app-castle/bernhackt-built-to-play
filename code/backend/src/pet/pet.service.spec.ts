import { Repository } from 'typeorm';
import { PetActivityService } from '../pet-activity/pet-activity.service';
import { Pet } from './entities/pet.entity';
import { PetEventsService } from './pet-events.service';
import { PetService } from './pet.service';
import { PetTemplate } from './templates/pet-template.interface';

const testPetTemplate: PetTemplate = {
  health: 100,
  attack: 10,
  defense: 5,
  healthGrowth: 5,
  attackGrowth: 2,
  defenseGrowth: 1,
  tiredDebuff: 0.3,
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
    accessToken: 'token',
    ...overrides,
  };
}

describe('PetService', () => {
  let petRepository: { findOneBy: jest.Mock; find: jest.Mock };
  let petActivityService: { isTired: jest.Mock; getStatus: jest.Mock };
  let service: PetService;

  beforeEach(() => {
    petRepository = { findOneBy: jest.fn(), find: jest.fn() };
    petActivityService = {
      isTired: jest.fn(
        (pet: Pet) => !!pet.tiredUntil && pet.tiredUntil.getTime() > Date.now(),
      ),
      getStatus: jest.fn(),
    };

    service = new PetService(
      petRepository as unknown as Repository<Pet>,
      testPetTemplate,
      { emitTrained: jest.fn() } as unknown as PetEventsService,
      petActivityService as unknown as PetActivityService,
    );
  });

  describe('getEffectiveStats', () => {
    it('applies the tiredness debuff to attack and defense but not health', () => {
      const pet = makePet({
        attack: 10,
        defense: 5,
        health: 100,
        level: 3,
        tiredUntil: new Date(Date.now() + 60_000),
      });

      const stats = service.getEffectiveStats(pet);

      // level 3 => 2 growth levels: attack 10+2*2=14, defense 5+1*2=7, health 100+5*2=110
      expect(stats.attack).toBeCloseTo(14 * 0.7);
      expect(stats.defense).toBeCloseTo(7 * 0.7);
      expect(stats.health).toBe(110);
    });

    it('applies no debuff once tiredUntil has passed', () => {
      const pet = makePet({
        attack: 10,
        defense: 5,
        level: 1,
        tiredUntil: new Date(Date.now() - 1000),
      });

      const stats = service.getEffectiveStats(pet);

      expect(stats.attack).toBe(10);
      expect(stats.defense).toBe(5);
    });

    it('applies no debuff when tiredUntil is null', () => {
      const pet = makePet({ attack: 10, defense: 5, tiredUntil: null });

      const stats = service.getEffectiveStats(pet);

      expect(stats.attack).toBe(10);
      expect(stats.defense).toBe(5);
    });
  });

  describe('listOthers', () => {
    it("excludes the caller and reports each pet's computed status", async () => {
      const caller = makePet({ id: 'caller', accessToken: 'caller-token' });
      const other = makePet({ id: 'other-1', name: 'Rex', level: 3 });

      petRepository.findOneBy.mockResolvedValue(caller);
      petRepository.find.mockResolvedValue([caller, other]);
      petActivityService.getStatus.mockResolvedValue({
        state: 'tired',
        availableAt: null,
      });

      const result = await service.listOthers('caller-token');

      expect(result).toEqual([
        {
          id: other.id,
          name: 'Rex',
          level: 3,
          status: { state: 'tired', availableAt: null },
        },
      ]);
    });
  });

  describe('getStatus', () => {
    it('loads the caller pet and delegates to PetActivityService', async () => {
      const pet = makePet({ accessToken: 'caller-token' });
      petRepository.findOneBy.mockResolvedValue(pet);
      petActivityService.getStatus.mockResolvedValue({
        state: 'available',
        availableAt: null,
      });

      const result = await service.getStatus('caller-token');

      expect(petActivityService.getStatus).toHaveBeenCalledWith(pet);
      expect(result).toEqual({ state: 'available', availableAt: null });
    });
  });
});
