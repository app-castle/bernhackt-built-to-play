import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetActivityModule } from '../pet-activity/pet-activity.module';
import { PetModule } from '../pet/pet.module';
import { BattleEventsService } from './battle-events.service';
import { BattleController } from './battle.controller';
import { BattleService } from './battle.service';
import { baseBattleTemplate } from './config/base-battle.template';
import { BATTLE_TEMPLATE } from './config/battle-template.token';
import { Battle } from './entities/battle.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Battle]), PetModule, PetActivityModule],
  controllers: [BattleController],
  providers: [
    BattleService,
    BattleEventsService,
    { provide: BATTLE_TEMPLATE, useValue: baseBattleTemplate },
  ],
})
export class BattleModule {}
