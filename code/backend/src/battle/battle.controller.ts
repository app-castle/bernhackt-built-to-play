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
import { BattleEventsService } from './battle-events.service';
import { BattleService } from './battle.service';
import { ChallengeBattleDto } from './dto/challenge-battle.dto';
import { ReturnBattleDto } from './dto/return-battle.dto';

@Controller('battles')
export class BattleController {
  constructor(
    @Inject(BattleService)
    private readonly battleService: BattleService,
    @Inject(PetService)
    private readonly petService: PetService,
    @Inject(BattleEventsService)
    private readonly battleEventsService: BattleEventsService,
  ) {}

  @Post()
  challenge(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: ChallengeBattleDto,
  ): Promise<ReturnBattleDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.battleService.challenge(accessToken, dto);
  }

  @Post(':id/accept')
  accept(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ): Promise<ReturnBattleDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.battleService.accept(accessToken, id);
  }

  @Get('me')
  listMine(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<ReturnBattleDto[]> {
    const accessToken = this.extractAccessToken(authorization);
    return this.battleService.listMine(accessToken);
  }

  @Sse('events')
  events(@Query('token') token: string | undefined): Observable<MessageEvent> {
    if (!token) {
      throw new UnauthorizedException('Missing access token');
    }

    return from(this.petService.load(token)).pipe(
      switchMap((pet) => this.battleEventsService.streamFor(pet.id)),
    );
  }

  @Get(':id')
  getById(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ): Promise<ReturnBattleDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.battleService.getById(accessToken, id);
  }

  private extractAccessToken(authorization: string | undefined): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid access token');
    }

    return authorization.slice('Bearer '.length);
  }
}
