import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetActivityModule } from '../pet-activity/pet-activity.module';
import { Pet } from './entities/pet.entity';
import { PetController } from './pet.controller';
import { PetEventsService } from './pet-events.service';
import { PetService } from './pet.service';
import { basePetTemplate } from './templates/base-pet.template';
import { PET_TEMPLATE } from './templates/pet-template.token';

@Module({
  imports: [TypeOrmModule.forFeature([Pet]), PetActivityModule],
  controllers: [PetController],
  providers: [
    PetService,
    PetEventsService,
    { provide: PET_TEMPLATE, useValue: basePetTemplate },
  ],
  exports: [PetService, PetEventsService],
})
export class PetModule {}
