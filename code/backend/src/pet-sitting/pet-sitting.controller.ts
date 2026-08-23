import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  MessageEvent,
  Param,
  Post,
  Query,
  Sse,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, from, switchMap } from 'rxjs';
import { PetService } from '../pet/pet.service';
import { CreatePetSittingDto } from './dto/create-pet-sitting.dto';
import { ReturnPetSittingDto } from './dto/return-pet-sitting.dto';
import { PetSittingEventsService } from './pet-sitting-events.service';
import { PetSittingService } from './pet-sitting.service';

@Controller('pet-sitting')
export class PetSittingController {
  constructor(
    @Inject(PetSittingService)
    private readonly petSittingService: PetSittingService,
    @Inject(PetService)
    private readonly petService: PetService,
    @Inject(PetSittingEventsService)
    private readonly petSittingEventsService: PetSittingEventsService,
  ) {}

  @Post()
  send(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: CreatePetSittingDto,
  ): Promise<ReturnPetSittingDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.petSittingService.send(accessToken, dto);
  }

  @Post(':id/accept')
  accept(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ): Promise<ReturnPetSittingDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.petSittingService.accept(accessToken, id);
  }

  @Get('me')
  listMine(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<ReturnPetSittingDto[]> {
    const accessToken = this.extractAccessToken(authorization);
    return this.petSittingService.listMine(accessToken);
  }

  @Sse('events')
  events(@Query('token') token: string | undefined): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    return from(this.petService.load(token)).pipe(
      switchMap((pet) => this.petSittingEventsService.streamFor(pet.id)),
    );
  }

  @Get(':id')
  getById(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ): Promise<ReturnPetSittingDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.petSittingService.getById(accessToken, id);
  }

  private extractAccessToken(authorization: string | undefined): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid access token');
    }

    return authorization.slice('Bearer '.length);
  }
}
