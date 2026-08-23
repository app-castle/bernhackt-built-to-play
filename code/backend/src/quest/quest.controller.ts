import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ReturnQuestHistoryDto } from './dto/return-quest-history.dto';
import { ReturnQuestResultDto } from './dto/return-quest-result.dto';
import { ReturnQuestSuggestionsDto } from './dto/return-quest-suggestions.dto';
import { SelectQuestDto } from './dto/select-quest.dto';
import { QuestService } from './quest.service';

@Controller('quests')
export class QuestController {
  constructor(
    @Inject(QuestService)
    private readonly questService: QuestService,
  ) {}

  @Get('suggestions')
  suggest(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<ReturnQuestSuggestionsDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.questService.suggest(accessToken);
  }

  @Post('select')
  select(
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: SelectQuestDto,
  ): Promise<ReturnQuestResultDto> {
    const accessToken = this.extractAccessToken(authorization);
    return this.questService.select(accessToken, dto);
  }

  @Get('me')
  listMine(
    @Headers('authorization') authorization: string | undefined,
  ): Promise<ReturnQuestHistoryDto[]> {
    const accessToken = this.extractAccessToken(authorization);
    return this.questService.listMine(accessToken);
  }

  private extractAccessToken(authorization: string | undefined): string {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid access token');
    }

    return authorization.slice('Bearer '.length);
  }
}
