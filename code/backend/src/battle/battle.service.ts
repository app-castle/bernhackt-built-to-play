import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PetActivityService } from '../pet-activity/pet-activity.service';
import { PetService } from '../pet/pet.service';
import type { BattleTemplate } from './config/battle-template.interface';
import { BATTLE_TEMPLATE } from './config/battle-template.token';
import { ChallengeBattleDto } from './dto/challenge-battle.dto';
import { ReturnBattleDto } from './dto/return-battle.dto';
import { Battle, BattleStatus } from './entities/battle.entity';
import { BattleEventsService } from './battle-events.service';
import { computeBattleOutcome } from './battle-combat';
import { Pet } from '../pet/entities/pet.entity';

@Injectable()
export class BattleService {
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  constructor(
    @InjectRepository(Battle)
    private readonly battleRepository: Repository<Battle>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly petService: PetService,
    private readonly petActivityService: PetActivityService,
    private readonly battleEventsService: BattleEventsService,
    @Inject(BATTLE_TEMPLATE)
    private readonly battleTemplate: BattleTemplate,
  ) {}

  async challenge(
    accessToken: string,
    dto: ChallengeBattleDto,
  ): Promise<ReturnBattleDto> {
    const challenger = await this.petService.load(accessToken);

    if (challenger.id === dto.defenderPetId) {
      throw new BadRequestException('You cannot challenge yourself');
    }

    const defender = await this.petService.findById(dto.defenderPetId);

    if (await this.isInActiveBattle(challenger.id)) {
      throw new ConflictException('You are already in a battle');
    }

    if (await this.isInActiveBattle(defender.id)) {
      throw new ConflictException('That player is already in a battle');
    }

    if (await this.petActivityService.isPetSittingBusy(challenger.id)) {
      throw new ConflictException('Your pet is busy pet sitting');
    }

    if (await this.petActivityService.isPetSittingBusy(defender.id)) {
      throw new ConflictException('That pet is busy pet sitting');
    }

    if (this.petActivityService.isTired(challenger)) {
      throw new ConflictException('Your pet is too tired to raid');
    }

    const now = new Date();
    const battle = this.battleRepository.create({
      challengerPetId: challenger.id,
      defenderPetId: defender.id,
      status: BattleStatus.PENDING,
      defended: false,
      winnerPetId: null,
      levelDifference: challenger.level - defender.level,
      challengerXpChange: null,
      defenderXpChange: null,
      createdAt: now,
      resolvedAt: null,
    });
    const savedBattle = await this.battleRepository.save(battle);

    this.battleEventsService.emitChallenge({
      battleId: savedBattle.id,
      defenderPetId: defender.id,
      challengerPetId: challenger.id,
      challengerName: challenger.name,
      challengerLevel: challenger.level,
      expiresAt: new Date(now.getTime() + this.battleTemplate.reactionWindowMs),
    });

    this.scheduleTimeout(savedBattle.id);

    return this.toReturnBattleDto(savedBattle);
  }

  async accept(
    accessToken: string,
    battleId: string,
  ): Promise<ReturnBattleDto> {
    const defenderPet = await this.petService.load(accessToken);
    let battle = await this.findBattleOrFail(battleId);

    if (battle.defenderPetId !== defenderPet.id) {
      throw new ForbiddenException('You are not the defender of this battle');
    }

    battle = await this.resolveIfExpired(battle);

    if (battle.status !== BattleStatus.PENDING) {
      throw new ConflictException('This battle is no longer pending');
    }

    const resolved = await this.resolve(battle.id, true);
    return this.toReturnBattleDto(resolved);
  }

  async getById(
    accessToken: string,
    battleId: string,
  ): Promise<ReturnBattleDto> {
    await this.petService.load(accessToken);
    const battle = await this.findBattleOrFail(battleId);
    const resolved = await this.resolveIfExpired(battle);
    return this.toReturnBattleDto(resolved);
  }

  async listMine(accessToken: string): Promise<ReturnBattleDto[]> {
    const pet = await this.petService.load(accessToken);
    const battles = await this.battleRepository.find({
      where: [{ challengerPetId: pet.id }, { defenderPetId: pet.id }],
      order: { createdAt: 'DESC' },
    });

    const resolved = await Promise.all(
      battles.map((battle) => this.resolveIfExpired(battle)),
    );
    return resolved.map((battle) => this.toReturnBattleDto(battle));
  }

  private async isInActiveBattle(petId: string): Promise<boolean> {
    const pending = await this.battleRepository.find({
      where: [
        { challengerPetId: petId, status: BattleStatus.PENDING },
        { defenderPetId: petId, status: BattleStatus.PENDING },
      ],
    });

    for (const battle of pending) {
      const resolved = await this.resolveIfExpired(battle);
      if (resolved.status === BattleStatus.PENDING) {
        return true;
      }
    }
    return false;
  }

  private async resolveIfExpired(battle: Battle): Promise<Battle> {
    if (battle.status !== BattleStatus.PENDING) {
      return battle;
    }

    const expiresAt =
      battle.createdAt.getTime() + this.battleTemplate.reactionWindowMs;
    if (Date.now() < expiresAt) {
      return battle;
    }

    return this.resolve(battle.id, false);
  }

  private async resolve(battleId: string, defended: boolean): Promise<Battle> {
    this.clearTimer(battleId);

    const { battle, resolvedEvent } = await this.dataSource.transaction(
      async (manager) => {
        const battle = await manager.findOne(Battle, {
          where: { id: battleId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!battle) {
          throw new NotFoundException('Battle not found');
        }

        if (battle.status === BattleStatus.RESOLVED) {
          return { battle, resolvedEvent: null };
        }

        const challenger = await manager.findOneByOrFail(Pet, {
          id: battle.challengerPetId,
        });
        const defender = await manager.findOneByOrFail(Pet, {
          id: battle.defenderPetId,
        });

        const { challengerWins, xpAmount } = computeBattleOutcome(
          {
            ...this.petService.getEffectiveStats(challenger),
            level: challenger.level,
          },
          {
            ...this.petService.getEffectiveStats(defender),
            level: defender.level,
          },
          defended,
          this.battleTemplate,
        );

        const winner = challengerWins ? challenger : defender;
        const loser = challengerWins ? defender : challenger;
        const challengerXpChange = challengerWins ? xpAmount : -xpAmount;
        const defenderXpChange = challengerWins ? -xpAmount : xpAmount;
        const resolvedAt = new Date();

        this.petService.awardXp(winner, xpAmount);
        this.petService.deductXp(loser, xpAmount);

        const tiredUntil = new Date(
          resolvedAt.getTime() + this.battleTemplate.raidTiredMs,
        );
        challenger.tiredUntil = tiredUntil;
        defender.tiredUntil = tiredUntil;

        battle.status = BattleStatus.RESOLVED;
        battle.defended = defended;
        battle.winnerPetId = winner.id;
        battle.resolvedAt = resolvedAt;
        battle.challengerXpChange = challengerXpChange;
        battle.defenderXpChange = defenderXpChange;

        await manager.save(Pet, winner);
        await manager.save(Pet, loser);
        const savedBattle = await manager.save(Battle, battle);

        return {
          battle: savedBattle,
          resolvedEvent: {
            battleId: savedBattle.id,
            challengerPetId: savedBattle.challengerPetId,
            defenderPetId: savedBattle.defenderPetId,
            winnerPetId: winner.id,
            defended,
            challengerXpChange,
            defenderXpChange,
            resolvedAt,
          },
        };
      },
    );

    if (resolvedEvent) {
      this.battleEventsService.emitResolved(resolvedEvent);
    }

    return battle;
  }

  private scheduleTimeout(battleId: string): void {
    const handle = setTimeout(() => {
      this.timers.delete(battleId);
      void this.resolve(battleId, false);
    }, this.battleTemplate.reactionWindowMs);
    this.timers.set(battleId, handle);
  }

  private clearTimer(battleId: string): void {
    const handle = this.timers.get(battleId);
    if (handle) {
      clearTimeout(handle);
      this.timers.delete(battleId);
    }
  }

  private async findBattleOrFail(id: string): Promise<Battle> {
    const battle = await this.battleRepository.findOneBy({ id });
    if (!battle) {
      throw new NotFoundException('Battle not found');
    }
    return battle;
  }

  private toReturnBattleDto(battle: Battle): ReturnBattleDto {
    return {
      id: battle.id,
      challengerPetId: battle.challengerPetId,
      defenderPetId: battle.defenderPetId,
      status: battle.status,
      defended: battle.defended,
      winnerPetId: battle.winnerPetId,
      levelDifference: battle.levelDifference,
      challengerXpChange: battle.challengerXpChange,
      defenderXpChange: battle.defenderXpChange,
      createdAt: battle.createdAt,
      resolvedAt: battle.resolvedAt,
    };
  }
}
