import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pet } from './entities/pet.entity';
import { PetController } from './pet.controller';
import { PetService } from './pet.service';
import { basePetTemplate } from './templates/base-pet.template';
import { PET_TEMPLATE } from './templates/pet-template.token';

@Module({
  imports: [TypeOrmModule.forFeature([Pet])],
  controllers: [PetController],
  providers: [PetService, { provide: PET_TEMPLATE, useValue: basePetTemplate }],
  exports: [PetService],
})
export class PetModule {}
