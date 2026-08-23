import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { getServerDateKey } from '../common/server-date.util';
import { Pet } from '../pet/entities/pet.entity';
import { PetService } from '../pet/pet.service';
import { QUEST_TEMPLATE } from './config/quest-template.token';
import type { QuestTemplate } from './config/quest-template.interface';
import { ReturnQuestHistoryDto } from './dto/return-quest-history.dto';
import { ReturnQuestResultDto } from './dto/return-quest-result.dto';
import { ReturnQuestSuggestionsDto } from './dto/return-quest-suggestions.dto';
import { SelectQuestDto } from './dto/select-quest.dto';
import { Quest } from './entities/quest.entity';
import { QuestAiService } from './quest-ai.service';
import { QUEST_KINDS, QuestKind } from './quest-kind';
import { computeQuestReward, pickRewardStat } from './quest-reward';
import { QUEST_WORDS } from './quest-word';

const SUGGESTION_COUNT = 3;
const WORDS_PER_QUEST = 3;

@Injectable()
export class QuestService {
  constructor(
    @InjectRepository(Quest)
    private readonly questRepository: Repository<Quest>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @Inject(PetService)
    private readonly petService: PetService,
    @Inject(QuestAiService)
    private readonly questAiService: QuestAiService,
    @Inject(QUEST_TEMPLATE)
    private readonly questTemplate: QuestTemplate,
  ) {}

  async suggest(accessToken: string): Promise<ReturnQuestSuggestionsDto> {
    await this.petService.load(accessToken);

    const kinds = this.pickRandom([...QUEST_KINDS], SUGGESTION_COUNT);
    return {
      suggestions: kinds.map((kind) => ({
        kind,
        words: this.pickRandom([...QUEST_WORDS], WORDS_PER_QUEST),
      })),
    };
  }

  async select(
    accessToken: string,
    dto: SelectQuestDto,
  ): Promise<ReturnQuestResultDto> {
    const pet = await this.petService.load(accessToken);

    this.validateSelection(dto);

    const todayKey = getServerDateKey(new Date());
    if (pet.lastQuestDate === todayKey) {
      throw new HttpException(
        'You already completed a quest today',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    let aiResult: { narrative: string; outcomeScore: number };
    try {
      aiResult = await this.questAiService.generateOutcome({
        kind: dto.kind,
        words: dto.words,
        petName: pet.name,
        petLevel: pet.level,
      });
    } catch {
      throw new HttpException(
        'Quest resolution failed, please try again later',
        HttpStatus.BAD_GATEWAY,
      );
    }

    const stat = pickRewardStat();
    const rewardAmount = computeQuestReward(
      stat,
      aiResult.outcomeScore,
      this.questTemplate,
    );

    // First system to ever mutate a pet's base stat column directly —
    // everywhere else, PetService.getEffectiveStats() only adds level
    // growth at read time, non-persisted.
    pet[stat] += rewardAmount;
    pet.lastQuestDate = todayKey;

    const quest = this.questRepository.create({
      petId: pet.id,
      kind: dto.kind,
      words: dto.words,
      outcomeText: aiResult.narrative,
      outcomeScore: aiResult.outcomeScore,
      rewardedStat: stat,
      rewardAmount,
      createdAt: new Date(),
    });

    const { savedPet, savedQuest } = await this.dataSource.transaction(
      async (manager) => {
        const savedPet = await manager.save(Pet, pet);
        const savedQuest = await manager.save(Quest, quest);
        return { savedPet, savedQuest };
      },
    );

    return this.toReturnQuestResultDto(savedQuest, savedPet);
  }

  async listMine(accessToken: string): Promise<ReturnQuestHistoryDto[]> {
    const pet = await this.petService.load(accessToken);
    const quests = await this.questRepository.find({
      where: { petId: pet.id },
      order: { createdAt: 'DESC' },
    });

    return quests.map((quest) => this.toReturnQuestHistoryDto(quest));
  }

  private validateSelection(dto: SelectQuestDto): void {
    if (!(QUEST_KINDS as readonly string[]).includes(dto.kind)) {
      throw new BadRequestException('Unknown quest kind');
    }
    if (
      dto.words.some(
        (word) => !(QUEST_WORDS as readonly string[]).includes(word),
      )
    ) {
      throw new BadRequestException('Unknown quest word');
    }
  }

  private pickRandom<T>(items: T[], count: number): T[] {
    const pool = [...items];
    const picked: T[] = [];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const index = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(index, 1)[0]);
    }
    return picked;
  }

  private toReturnQuestResultDto(quest: Quest, pet: Pet): ReturnQuestResultDto {
    return {
      id: quest.id,
      kind: quest.kind as QuestKind,
      words: quest.words,
      outcomeText: quest.outcomeText,
      outcomeScore: quest.outcomeScore,
      rewardedStat: quest.rewardedStat,
      rewardAmount: quest.rewardAmount,
      createdAt: quest.createdAt,
      xp: pet.xp,
      level: pet.level,
      ...this.petService.getEffectiveStats(pet),
    };
  }

  private toReturnQuestHistoryDto(quest: Quest): ReturnQuestHistoryDto {
    return {
      id: quest.id,
      kind: quest.kind as QuestKind,
      words: quest.words,
      outcomeText: quest.outcomeText,
      outcomeScore: quest.outcomeScore,
      rewardedStat: quest.rewardedStat,
      rewardAmount: quest.rewardAmount,
      createdAt: quest.createdAt,
    };
  }
}
