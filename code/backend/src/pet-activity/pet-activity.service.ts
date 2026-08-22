import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { BattleTemplate } from '../battle/config/battle-template.interface';
import { BATTLE_TEMPLATE } from '../battle/config/battle-template.token';
import { Battle, BattleStatus } from '../battle/entities/battle.entity';
import { Pet } from '../pet/entities/pet.entity';
import type { PetSittingTemplate } from '../pet-sitting/config/pet-sitting-template.interface';
import { PET_SITTING_TEMPLATE } from '../pet-sitting/config/pet-sitting-template.token';
import {
  PetSitting,
  PetSittingStatus,
} from '../pet-sitting/entities/pet-sitting.entity';
import { PetStatus } from './pet-status';

@Injectable()
export class PetActivityService {
  constructor(
    @InjectRepository(Battle)
    private readonly battleRepository: Repository<Battle>,
    @InjectRepository(PetSitting)
    private readonly petSittingRepository: Repository<PetSitting>,
    @Inject(BATTLE_TEMPLATE)
    private readonly battleTemplate: BattleTemplate,
    @Inject(PET_SITTING_TEMPLATE)
    private readonly petSittingTemplate: PetSittingTemplate,
  ) {}

  async isInActiveBattle(petId: string): Promise<boolean> {
    const pending = await this.battleRepository.find({
      where: [
        { challengerPetId: petId, status: BattleStatus.PENDING },
        { defenderPetId: petId, status: BattleStatus.PENDING },
      ],
    });

    const now = Date.now();
    return pending.some(
      (battle) =>
        now < battle.createdAt.getTime() + this.battleTemplate.reactionWindowMs,
    );
  }

  async isPetSittingBusy(petId: string): Promise<boolean> {
    const rows = await this.petSittingRepository.find({
      where: [
        { senderPetId: petId, status: PetSittingStatus.PENDING },
        { hostPetId: petId, status: PetSittingStatus.PENDING },
        { senderPetId: petId, status: PetSittingStatus.ACTIVE },
        { hostPetId: petId, status: PetSittingStatus.ACTIVE },
      ],
    });

    const now = Date.now();
    return rows.some((sitting) => {
      if (sitting.status === PetSittingStatus.PENDING) {
        return (
          now <
          sitting.createdAt.getTime() + this.petSittingTemplate.inviteExpiryMs
        );
      }

      if (sitting.status === PetSittingStatus.ACTIVE && sitting.acceptedAt) {
        return (
          now <
          sitting.acceptedAt.getTime() +
            this.petSittingTemplate.sessionDurationMs
        );
      }

      return false;
    });
  }

  isTired(pet: Pet): boolean {
    return !!pet.tiredUntil && pet.tiredUntil.getTime() > Date.now();
  }

  async getStatus(pet: Pet): Promise<PetStatus> {
    if (await this.isInActiveBattle(pet.id)) {
      return { state: 'raiding', availableAt: null };
    }

    if (await this.isPetSittingBusy(pet.id)) {
      return { state: 'pet_sitting', availableAt: null };
    }

    if (this.isTired(pet)) {
      return { state: 'tired', availableAt: pet.tiredUntil };
    }

    return { state: 'available', availableAt: null };
  }

  async isAvailable(pet: Pet): Promise<boolean> {
    const status = await this.getStatus(pet);
    return status.state === 'available';
  }
}
