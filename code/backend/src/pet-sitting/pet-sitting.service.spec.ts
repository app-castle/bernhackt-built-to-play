import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PetActivityService } from '../pet-activity/pet-activity.service';
import { Pet } from '../pet/entities/pet.entity';
import { PetEventsService } from '../pet/pet-events.service';
import { PetService } from '../pet/pet.service';
import { PetTemplate } from '../pet/templates/pet-template.interface';
import { PetSittingTemplate } from './config/pet-sitting-template.interface';
import { PetSitting, PetSittingStatus } from './entities/pet-sitting.entity';
import { PetSittingEventsService } from './pet-sitting-events.service';
import { PetSittingService } from './pet-sitting.service';

const testPetTemplate: PetTemplate = {
  health: 100,
  attack: 10,
  defense: 5,
  healthGrowth: 0,
  attackGrowth: 0,
  defenseGrowth: 0,
  tiredDebuff: 0.3,
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

function makePetSitting(overrides: Partial<PetSitting>): PetSitting {
  return {
    id: 'sitting-id',
    senderPetId: 'sender-1',
    sender: undefined as unknown as Pet,
    hostPetId: 'host-1',
    host: undefined as unknown as Pet,
    letter: 'Please take care of my pet!',
    status: PetSittingStatus.PENDING,
    createdAt: new Date(),
    acceptedAt: null,
    endedAt: null,
    ...overrides,
  };
}

describe('PetSittingService', () => {
  let sender: Pet;
  let host: Pet;
  let petRepository: { findOneBy: jest.Mock };
  let petService: PetService;
  let petSittingRepository: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    findOneBy: jest.Mock;
  };
  let manager: { findOne: jest.Mock; save: jest.Mock };
  let dataSource: { transaction: jest.Mock };
  let petActivityService: { isAvailable: jest.Mock; isTired: jest.Mock };
  let petSittingEventsService: {
    emitInvited: jest.Mock;
    emitStarted: jest.Mock;
    emitEnded: jest.Mock;
  };
  let petEventsService: { trained$: { subscribe: jest.Mock } };
  let service: PetSittingService;

  beforeEach(() => {
    sender = makePet({ id: 'sender-1', accessToken: 'sender-token', xp: 0 });
    host = makePet({ id: 'host-1', accessToken: 'host-token', xp: 0 });

    petRepository = { findOneBy: jest.fn() };
    petRepository.findOneBy.mockImplementation(({ id, accessToken }) => {
      if (id === sender.id || accessToken === sender.accessToken)
        return Promise.resolve(sender);
      if (id === host.id || accessToken === host.accessToken)
        return Promise.resolve(host);
      return Promise.resolve(null);
    });

    petActivityService = {
      isAvailable: jest.fn().mockResolvedValue(true),
      isTired: jest.fn().mockReturnValue(false),
    };

    petService = new PetService(
      petRepository as unknown as Repository<Pet>,
      testPetTemplate,
      { emitTrained: jest.fn() } as unknown as PetEventsService,
      petActivityService as unknown as PetActivityService,
    );

    petSittingRepository = {
      create: jest.fn((data: Partial<PetSitting>) => ({
        ...makePetSitting({}),
        ...data,
      })),
      save: jest.fn((row) => Promise.resolve(row)),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneBy: jest.fn(),
    };

    manager = {
      findOne: jest.fn(),
      save: jest.fn((_entity, data) => Promise.resolve(data)),
    };

    dataSource = {
      transaction: jest.fn((cb: (m: typeof manager) => unknown) => cb(manager)),
    };

    petSittingEventsService = {
      emitInvited: jest.fn(),
      emitStarted: jest.fn(),
      emitEnded: jest.fn(),
    };

    petEventsService = { trained$: { subscribe: jest.fn() } };

    service = new PetSittingService(
      petSittingRepository as unknown as Repository<PetSitting>,
      dataSource as unknown as DataSource,
      petService,
      petActivityService as unknown as PetActivityService,
      petSittingEventsService as unknown as PetSittingEventsService,
      petEventsService as unknown as PetEventsService,
      testPetSittingTemplate,
    );
  });

  describe('send', () => {
    it('rejects sending a pet to itself', async () => {
      await expect(
        service.send(sender.accessToken, {
          hostPetId: sender.id,
          letter: 'hi',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when the sender is not available', async () => {
      petActivityService.isAvailable.mockResolvedValueOnce(false);

      await expect(
        service.send(sender.accessToken, {
          hostPetId: host.id,
          letter: 'hi',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects when the host is not available', async () => {
      petActivityService.isAvailable
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await expect(
        service.send(sender.accessToken, {
          hostPetId: host.id,
          letter: 'hi',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a pending invitation and emits an SSE invite event', async () => {
      const setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation(() => 0 as unknown as NodeJS.Timeout);

      const result = await service.send(sender.accessToken, {
        hostPetId: host.id,
        letter: 'Take care of my pet!',
      });

      expect(result.status).toBe(PetSittingStatus.PENDING);
      expect(petSittingEventsService.emitInvited).toHaveBeenCalledWith(
        expect.objectContaining({
          senderPetId: sender.id,
          hostPetId: host.id,
        }),
      );

      setTimeoutSpy.mockRestore();
    });
  });

  describe('accept', () => {
    it('rejects when the caller is not the host', async () => {
      const petSitting = makePetSitting({
        senderPetId: sender.id,
        hostPetId: host.id,
      });
      petSittingRepository.findOneBy.mockResolvedValue(petSitting);

      await expect(
        service.accept(sender.accessToken, petSitting.id),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects an already-expired invitation', async () => {
      const petSitting = makePetSitting({
        senderPetId: sender.id,
        hostPetId: host.id,
        createdAt: new Date(Date.now() - 6 * 60_000),
      });
      petSittingRepository.findOneBy.mockResolvedValue(petSitting);
      manager.findOne.mockResolvedValue(petSitting);

      await expect(
        service.accept(host.accessToken, petSitting.id),
      ).rejects.toThrow(ConflictException);
    });

    it('activates the session and emits started for both pets', async () => {
      const petSitting = makePetSitting({
        senderPetId: sender.id,
        hostPetId: host.id,
        createdAt: new Date(),
      });
      petSittingRepository.findOneBy.mockResolvedValue(petSitting);
      const setTimeoutSpy = jest
        .spyOn(global, 'setTimeout')
        .mockImplementation(() => 0 as unknown as NodeJS.Timeout);

      const result = await service.accept(host.accessToken, petSitting.id);

      expect(result.status).toBe(PetSittingStatus.ACTIVE);
      expect(result.acceptedAt).not.toBeNull();
      expect(petSittingEventsService.emitStarted).toHaveBeenCalledWith(
        expect.objectContaining({
          senderPetId: sender.id,
          hostPetId: host.id,
        }),
      );

      setTimeoutSpy.mockRestore();
    });
  });

  describe('lazy expiry / auto-end', () => {
    it('marks a stale pending invitation as expired on read', async () => {
      const petSitting = makePetSitting({
        createdAt: new Date(Date.now() - 6 * 60_000),
      });
      petSittingRepository.findOneBy.mockResolvedValue(petSitting);
      manager.findOne.mockResolvedValue(petSitting);

      const result = await service.getById(sender.accessToken, petSitting.id);

      expect(result.status).toBe(PetSittingStatus.EXPIRED);
    });

    it('auto-ends an active session past its duration and emits ended', async () => {
      const petSitting = makePetSitting({
        senderPetId: sender.id,
        hostPetId: host.id,
        status: PetSittingStatus.ACTIVE,
        acceptedAt: new Date(Date.now() - 61 * 60_000),
      });
      petSittingRepository.findOneBy.mockResolvedValue(petSitting);
      manager.findOne.mockResolvedValue(petSitting);

      const result = await service.getById(sender.accessToken, petSitting.id);

      expect(result.status).toBe(PetSittingStatus.ENDED);
      expect(petSittingEventsService.emitEnded).toHaveBeenCalledWith(
        expect.objectContaining({
          senderPetId: sender.id,
          hostPetId: host.id,
        }),
      );
    });
  });

  describe('XP sharing while hosting', () => {
    it('awards the sender pet the same XP the host pet earns from training', async () => {
      petSittingRepository.findOne.mockResolvedValue(
        makePetSitting({
          senderPetId: sender.id,
          hostPetId: host.id,
          status: PetSittingStatus.ACTIVE,
        }),
      );
      manager.findOne.mockResolvedValue(sender);

      await (
        service as unknown as {
          shareTrainingXp: (hostPetId: string, xp: number) => Promise<void>;
        }
      ).shareTrainingXp(host.id, 25);

      expect(sender.xp).toBe(25);
    });

    it('does nothing when the trained pet is not hosting anyone', async () => {
      petSittingRepository.findOne.mockResolvedValue(null);

      await (
        service as unknown as {
          shareTrainingXp: (hostPetId: string, xp: number) => Promise<void>;
        }
      ).shareTrainingXp(host.id, 25);

      expect(sender.xp).toBe(0);
    });

    it('subscribes to petEventsService.trained$ on module init', () => {
      service.onModuleInit();

      expect(petEventsService.trained$.subscribe).toHaveBeenCalled();
    });
  });
});
