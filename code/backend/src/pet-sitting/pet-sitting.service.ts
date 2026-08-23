import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PetActivityService } from '../pet-activity/pet-activity.service';
import { Pet } from '../pet/entities/pet.entity';
import { PetEventsService } from '../pet/pet-events.service';
import { PetService } from '../pet/pet.service';
import type { PetSittingTemplate } from './config/pet-sitting-template.interface';
import { PET_SITTING_TEMPLATE } from './config/pet-sitting-template.token';
import { CreatePetSittingDto } from './dto/create-pet-sitting.dto';
import { ReturnPetSittingDto } from './dto/return-pet-sitting.dto';
import { PetSitting, PetSittingStatus } from './entities/pet-sitting.entity';
import { PetSittingEventsService } from './pet-sitting-events.service';

@Injectable()
export class PetSittingService implements OnModuleInit {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    @InjectRepository(PetSitting)
    private readonly petSittingRepository: Repository<PetSitting>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(PetService)
    private readonly petService: PetService,
    @Inject(PetActivityService)
    private readonly petActivityService: PetActivityService,
    @Inject(PetSittingEventsService)
    private readonly petSittingEventsService: PetSittingEventsService,
    @Inject(PetEventsService)
    private readonly petEventsService: PetEventsService,
    @Inject(PET_SITTING_TEMPLATE)
    private readonly petSittingTemplate: PetSittingTemplate,
  ) {}

  onModuleInit(): void {
    this.petEventsService.trained$.subscribe((event) => {
      void this.shareTrainingXp(event.petId, event.xpAwarded);
    });
  }

  async send(
    accessToken: string,
    dto: CreatePetSittingDto,
  ): Promise<ReturnPetSittingDto> {
    const sender = await this.petService.load(accessToken);

    if (sender.id === dto.hostPetId) {
      throw new BadRequestException('You cannot send your pet to itself');
    }

    const host = await this.petService.findById(dto.hostPetId);

    if (!(await this.petActivityService.isAvailable(sender))) {
      throw new ConflictException('Your pet is not available right now');
    }

    if (!(await this.petActivityService.isAvailable(host))) {
      throw new ConflictException('That pet is not available right now');
    }

    const now = new Date();
    const petSitting = this.petSittingRepository.create({
      senderPetId: sender.id,
      hostPetId: host.id,
      letter: dto.letter,
      status: PetSittingStatus.PENDING,
      createdAt: now,
      acceptedAt: null,
      endedAt: null,
    });
    const saved = await this.petSittingRepository.save(petSitting);

    this.petSittingEventsService.emitInvited({
      petSittingId: saved.id,
      senderPetId: sender.id,
      senderName: sender.name,
      hostPetId: host.id,
      letter: saved.letter,
      expiresAt: new Date(
        now.getTime() + this.petSittingTemplate.inviteExpiryMs,
      ),
    });

    this.scheduleInviteExpiry(saved.id);

    return this.toReturnDto(saved);
  }

  async accept(accessToken: string, id: string): Promise<ReturnPetSittingDto> {
    const host = await this.petService.load(accessToken);
    let petSitting = await this.findOrFail(id);

    if (petSitting.hostPetId !== host.id) {
      throw new ForbiddenException('You are not the host of this invitation');
    }

    petSitting = await this.resolveIfExpired(petSitting);

    if (petSitting.status !== PetSittingStatus.PENDING) {
      throw new ConflictException('This invitation is no longer pending');
    }

    this.clearTimer(petSitting.id);

    const now = new Date();
    petSitting.status = PetSittingStatus.ACTIVE;
    petSitting.acceptedAt = now;
    const saved = await this.petSittingRepository.save(petSitting);

    this.petSittingEventsService.emitStarted({
      petSittingId: saved.id,
      senderPetId: saved.senderPetId,
      hostPetId: saved.hostPetId,
      startedAt: now,
      endsAt: new Date(
        now.getTime() + this.petSittingTemplate.sessionDurationMs,
      ),
    });

    this.scheduleSessionEnd(saved.id);

    return this.toReturnDto(saved);
  }

  async getById(accessToken: string, id: string): Promise<ReturnPetSittingDto> {
    await this.petService.load(accessToken);
    const petSitting = await this.findOrFail(id);
    const resolved = await this.resolveIfExpired(petSitting);
    return this.toReturnDto(resolved);
  }

  async listMine(accessToken: string): Promise<ReturnPetSittingDto[]> {
    const pet = await this.petService.load(accessToken);
    const rows = await this.petSittingRepository.find({
      where: [{ senderPetId: pet.id }, { hostPetId: pet.id }],
      order: { createdAt: 'DESC' },
    });

    const resolved = await Promise.all(
      rows.map((row) => this.resolveIfExpired(row)),
    );
    return resolved.map((row) => this.toReturnDto(row));
  }

  private async shareTrainingXp(
    hostPetId: string,
    xpAwarded: number,
  ): Promise<void> {
    const active = await this.petSittingRepository.findOne({
      where: { hostPetId, status: PetSittingStatus.ACTIVE },
    });

    if (!active) {
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const senderPet = await manager.findOne(Pet, {
        where: { id: active.senderPetId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!senderPet) {
        return;
      }

      this.petService.awardXp(senderPet, xpAwarded);
      await manager.save(Pet, senderPet);
    });
  }

  private async resolveIfExpired(petSitting: PetSitting): Promise<PetSitting> {
    if (petSitting.status === PetSittingStatus.PENDING) {
      const expiresAt =
        petSitting.createdAt.getTime() + this.petSittingTemplate.inviteExpiryMs;
      if (Date.now() >= expiresAt) {
        return this.expire(petSitting.id);
      }
      return petSitting;
    }

    if (
      petSitting.status === PetSittingStatus.ACTIVE &&
      petSitting.acceptedAt
    ) {
      const endsAt =
        petSitting.acceptedAt.getTime() +
        this.petSittingTemplate.sessionDurationMs;
      if (Date.now() >= endsAt) {
        return this.endSession(petSitting.id);
      }
      return petSitting;
    }

    return petSitting;
  }

  private async expire(id: string): Promise<PetSitting> {
    this.clearTimer(id);

    return this.dataSource.transaction(async (manager) => {
      const petSitting = await manager.findOne(PetSitting, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!petSitting) {
        throw new NotFoundException('Pet sitting invitation not found');
      }

      if (petSitting.status !== PetSittingStatus.PENDING) {
        return petSitting;
      }

      petSitting.status = PetSittingStatus.EXPIRED;
      return manager.save(PetSitting, petSitting);
    });
  }

  private async endSession(id: string): Promise<PetSitting> {
    this.clearTimer(id);

    const { petSitting, endedEvent } = await this.dataSource.transaction(
      async (manager) => {
        const petSitting = await manager.findOne(PetSitting, {
          where: { id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!petSitting) {
          throw new NotFoundException('Pet sitting invitation not found');
        }

        if (petSitting.status !== PetSittingStatus.ACTIVE) {
          return { petSitting, endedEvent: null };
        }

        const now = new Date();
        petSitting.status = PetSittingStatus.ENDED;
        petSitting.endedAt = now;
        const saved = await manager.save(PetSitting, petSitting);

        return {
          petSitting: saved,
          endedEvent: {
            petSittingId: saved.id,
            senderPetId: saved.senderPetId,
            hostPetId: saved.hostPetId,
            endedAt: now,
          },
        };
      },
    );

    if (endedEvent) {
      this.petSittingEventsService.emitEnded(endedEvent);
    }

    return petSitting;
  }

  private scheduleInviteExpiry(id: string): void {
    const handle = setTimeout(() => {
      this.timers.delete(id);
      void this.expire(id);
    }, this.petSittingTemplate.inviteExpiryMs);
    this.timers.set(id, handle);
  }

  private scheduleSessionEnd(id: string): void {
    const handle = setTimeout(() => {
      this.timers.delete(id);
      void this.endSession(id);
    }, this.petSittingTemplate.sessionDurationMs);
    this.timers.set(id, handle);
  }

  private clearTimer(id: string): void {
    const handle = this.timers.get(id);
    if (handle) {
      clearTimeout(handle);
      this.timers.delete(id);
    }
  }

  private async findOrFail(id: string): Promise<PetSitting> {
    const petSitting = await this.petSittingRepository.findOneBy({ id });
    if (!petSitting) {
      throw new NotFoundException('Pet sitting invitation not found');
    }
    return petSitting;
  }

  private toReturnDto(petSitting: PetSitting): ReturnPetSittingDto {
    return {
      id: petSitting.id,
      senderPetId: petSitting.senderPetId,
      hostPetId: petSitting.hostPetId,
      letter: petSitting.letter,
      status: petSitting.status,
      createdAt: petSitting.createdAt,
      acceptedAt: petSitting.acceptedAt,
      endedAt: petSitting.endedAt,
    };
  }
}
