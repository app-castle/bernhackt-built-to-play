import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { CreatePetDto } from './dto/create-pet.dto';
import { ReturnCreatedPetDto } from './dto/return-created-pet.dto';
import { ReturnPetTrainingDto } from './dto/return-pet-training.dto';
import { ReturnPetDto } from './dto/return-pet.dto';
import { TrainPetDto } from './dto/train-pet.dto';
import { PetService } from './pet.service';

@Controller('pets')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Post()
  create(@Body() dto: CreatePetDto): Promise<ReturnCreatedPetDto> {
    return this.petService.create(dto);
  }

  @Post('training')
  train(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: TrainPetDto,
  ): Promise<ReturnPetTrainingDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.petService.train(accessToken, dto);
  }

  @Get('me')
  getCurrent(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<ReturnPetDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.petService.getCurrent(accessToken);
  }

  @Get()
  listOthers(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<ReturnPetDto[]> {
    const accessToken = this.extractAccessToken(authorization);
    return this.petService.listOthers(accessToken);
  }

  private extractAccessToken(authorization: string | undefined): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid access token');
    }

    return authorization.slice('Bearer '.length);
  }
}
