import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetActivityModule } from '../pet-activity/pet-activity.module';
import { PetModule } from '../pet/pet.module';
import { basePetSittingTemplate } from './config/base-pet-sitting.template';
import { PET_SITTING_TEMPLATE } from './config/pet-sitting-template.token';
import { PetSitting } from './entities/pet-sitting.entity';
import { PetSittingEventsService } from './pet-sitting-events.service';
import { PetSittingController } from './pet-sitting.controller';
import { PetSittingService } from './pet-sitting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PetSitting]),
    PetModule,
    PetActivityModule,
  ],
  controllers: [PetSittingController],
  providers: [
    PetSittingService,
    PetSittingEventsService,
    { provide: PET_SITTING_TEMPLATE, useValue: basePetSittingTemplate },
  ],
})
export class PetSittingModule {}
