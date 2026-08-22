import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { baseBattleTemplate } from '../battle/config/base-battle.template';
import { BATTLE_TEMPLATE } from '../battle/config/battle-template.token';
import { Battle } from '../battle/entities/battle.entity';
import { basePetSittingTemplate } from '../pet-sitting/config/base-pet-sitting.template';
import { PET_SITTING_TEMPLATE } from '../pet-sitting/config/pet-sitting-template.token';
import { PetSitting } from '../pet-sitting/entities/pet-sitting.entity';
import { PetActivityService } from './pet-activity.service';

@Module({
  imports: [TypeOrmModule.forFeature([Battle, PetSitting])],
  providers: [
    PetActivityService,
    { provide: BATTLE_TEMPLATE, useValue: baseBattleTemplate },
    { provide: PET_SITTING_TEMPLATE, useValue: basePetSittingTemplate },
  ],
  exports: [PetActivityService],
})
export class PetActivityModule {}
