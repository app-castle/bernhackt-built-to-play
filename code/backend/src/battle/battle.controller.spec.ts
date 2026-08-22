import { UnauthorizedException } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { PetService } from '../pet/pet.service';
import { BattleController } from './battle.controller';
import { BattleEventsService } from './battle-events.service';
import { BattleService } from './battle.service';

describe('BattleController', () => {
  let battleService: Partial<jest.Mocked<BattleService>>;
  let petService: Partial<jest.Mocked<PetService>>;
  let battleEventsService: Partial<jest.Mocked<BattleEventsService>>;
  let controller: BattleController;

  beforeEach(() => {
    battleService = {
      listPlayers: jest.fn(),
      challenge: jest.fn(),
      accept: jest.fn(),
      listMine: jest.fn(),
      getById: jest.fn(),
    };
    petService = { load: jest.fn() };
    battleEventsService = { streamFor: jest.fn() };

    controller = new BattleController(
      battleService as unknown as BattleService,
      petService as unknown as PetService,
      battleEventsService as unknown as BattleEventsService,
    );
  });

  it('extracts the bearer token and delegates listPlayers', async () => {
    await controller.listPlayers('Bearer abc123');
    expect(battleService.listPlayers).toHaveBeenCalledWith('abc123');
  });

  it('throws UnauthorizedException when the authorization header is missing', () => {
    expect(() => controller.listPlayers(undefined)).toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException when the authorization header has no Bearer prefix', () => {
    expect(() => controller.listPlayers('abc123')).toThrow(
      UnauthorizedException,
    );
  });

  it('delegates challenge with the extracted token and body', async () => {
    await controller.challenge('Bearer abc123', { defenderPetId: 'pet-2' });
    expect(battleService.challenge).toHaveBeenCalledWith('abc123', {
      defenderPetId: 'pet-2',
    });
  });

  it('delegates accept with the extracted token and battle id', async () => {
    await controller.accept('Bearer abc123', 'battle-1');
    expect(battleService.accept).toHaveBeenCalledWith('abc123', 'battle-1');
  });

  it('rejects the SSE stream when no token query param is provided', () => {
    expect(() => controller.events(undefined)).toThrow(UnauthorizedException);
  });

  it('streams battle events scoped to the authenticated pet', async () => {
    (petService.load as jest.Mock).mockResolvedValue({ id: 'pet-1' });
    (battleEventsService.streamFor as jest.Mock).mockReturnValue(
      of({ data: { battleId: 'battle-1' } }),
    );

    const event = await firstValueFrom(controller.events('token-1'));

    expect(petService.load).toHaveBeenCalledWith('token-1');
    expect(battleEventsService.streamFor).toHaveBeenCalledWith('pet-1');
    expect(event).toEqual({ data: { battleId: 'battle-1' } });
  });
});
