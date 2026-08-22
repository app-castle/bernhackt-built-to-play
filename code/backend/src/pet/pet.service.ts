import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes } from 'node:crypto';
import { Repository } from 'typeorm';
import { PetActivityService } from '../pet-activity/pet-activity.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { ReturnCreatedPetDto } from './dto/return-created-pet.dto';
import { ReturnPetTrainingDto } from './dto/return-pet-training.dto';
import { ReturnPetDto } from './dto/return-pet.dto';
import { TrainPetDto } from './dto/train-pet.dto';
import { Pet } from './entities/pet.entity';
import { PetEventsService } from './pet-events.service';
import type { PetTemplate } from './templates/pet-template.interface';
import { PET_TEMPLATE } from './templates/pet-template.token';

const TRAINING_COOLDOWN_MS = 0; // as long as we got the cookie clicker variant
const LEVEL_UP_BASE_XP = 100;
const LEVEL_UP_GROWTH_RATE = 1.2;

@Injectable()
export class PetService {
  constructor(
    @InjectRepository(Pet)
    private readonly petRepository: Repository<Pet>,
    @Inject(PET_TEMPLATE)
    private readonly petTemplate: PetTemplate,
    private readonly petEventsService: PetEventsService,
    private readonly petActivityService: PetActivityService,
  ) {}

  async create(dto: CreatePetDto): Promise<ReturnCreatedPetDto> {
    const pet = this.petRepository.create({
      name: dto.name,
      health: this.petTemplate.health,
      attack: this.petTemplate.attack,
      defense: this.petTemplate.defense,
      xp: 0,
      accessToken: randomBytes(32).toString('hex'),
    });

    const savedPet = await this.petRepository.save(pet);
    return this.toReturnCreatedPetDto(savedPet);
  }

  async load(accessToken: string): Promise<Pet> {
    const pet = await this.petRepository.findOneBy({ accessToken });

    if (!pet) {
      throw new NotFoundException('No pet found for this access token');
    }

    return pet;
  }

  async findAll(): Promise<Pet[]> {
    return this.petRepository.find();
  }

  async findById(id: string): Promise<Pet> {
    const pet = await this.petRepository.findOneBy({ id });

    if (!pet) {
      throw new NotFoundException('No pet found for this id');
    }

    return pet;
  }

  async getCurrent(accessToken: string): Promise<ReturnPetDto> {
    const pet = await this.load(accessToken);
    return this.toReturnPetDto(pet);
  }

  async train(
    accessToken: string,
    dto: TrainPetDto,
  ): Promise<ReturnPetTrainingDto> {
    const pet = await this.load(accessToken);

    const now = new Date();

    if (
      pet.lastTrainedAt &&
      now.getTime() - pet.lastTrainedAt.getTime() < TRAINING_COOLDOWN_MS
    ) {
      throw new HttpException(
        'Training is on cooldown, please try again later',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const todayKey = this.getServerDateKey(now);
    if (pet.dailyKeystrokesDate !== todayKey) {
      pet.dailyKeystrokes = 0;
      pet.dailyKeystrokesDate = todayKey;
    }
    pet.dailyKeystrokes += dto.intensity;

    const factor = this.getXpFactor(pet.dailyKeystrokes);
    const xpAwarded = dto.intensity * factor;
    this.awardXp(pet, xpAwarded);

    pet.lastTrainedAt = now;

    const savedPet = await this.petRepository.save(pet);
    this.petEventsService.emitTrained({ petId: savedPet.id, xpAwarded });
    return this.toReturnPetTrainingDto(savedPet);
  }

  getEffectiveStats(pet: Pet): {
    attack: number;
    defense: number;
    health: number;
  } {
    const growthLevels = pet.level - 1;
    const debuff = this.petActivityService.isTired(pet)
      ? 1 - this.petTemplate.tiredDebuff
      : 1;
    return {
      attack:
        (pet.attack + this.petTemplate.attackGrowth * growthLevels) * debuff,
      defense:
        (pet.defense + this.petTemplate.defenseGrowth * growthLevels) * debuff,
      health: pet.health + this.petTemplate.healthGrowth * growthLevels,
    };
  }

  async listOthers(accessToken: string): Promise<ReturnPetDto[]> {
    const caller = await this.load(accessToken);
    const others = (await this.findAll()).filter((pet) => pet.id !== caller.id);

    return Promise.all(others.map((pet) => this.toReturnPetDto(pet)));
  }

  awardXp(pet: Pet, amount: number): void {
    pet.xp += amount;
    this.applyLevelUps(pet);
    pet.xp = Math.round(pet.xp);
  }

  deductXp(pet: Pet, amount: number): void {
    pet.xp = Math.max(0, pet.xp - amount);
  }

  private applyLevelUps(pet: Pet): void {
    while (pet.xp >= this.getXpThreshold(pet.level)) {
      pet.xp -= this.getXpThreshold(pet.level);
      pet.level += 1;
    }
  }

  private getServerDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getXpFactor(dailyKeystrokes: number): number {
    if (dailyKeystrokes <= 2000) return 1.0;
    if (dailyKeystrokes <= 5000) return 0.75;
    if (dailyKeystrokes <= 10000) return 0.5;
    if (dailyKeystrokes <= 20000) return 0.25;
    return 0.1;
  }

  private getXpThreshold(level: number): number {
    return LEVEL_UP_BASE_XP * Math.pow(LEVEL_UP_GROWTH_RATE, level - 1);
  }

  private toReturnPetTrainingDto(pet: Pet): ReturnPetTrainingDto {
    return {
      xp: pet.xp,
      level: pet.level,
      ...this.getEffectiveStats(pet),
    };
  }

  private async toReturnPetDto(pet: Pet): Promise<ReturnPetDto> {
    return {
      ...this.toReturnPetTrainingDto(pet),
      id: pet.id,
      name: pet.name,
      status: await this.petActivityService.getStatus(pet),
    };
  }

  private async toReturnCreatedPetDto(pet: Pet): Promise<ReturnCreatedPetDto> {
    return {
      ...(await this.toReturnPetDto(pet)),
      accessToken: pet.accessToken,
    };
  }
}
