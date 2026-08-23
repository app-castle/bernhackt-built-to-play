import { UnauthorizedException } from '@nestjs/common';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';

describe('QuestController', () => {
  let questService: Partial<jest.Mocked<QuestService>>;
  let controller: QuestController;

  beforeEach(() => {
    questService = {
      suggest: jest.fn(),
      select: jest.fn(),
      listMine: jest.fn(),
    };

    controller = new QuestController(questService as unknown as QuestService);
  });

  it('throws UnauthorizedException from suggest when the authorization header is missing', () => {
    expect(() => controller.suggest(undefined)).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException from select when the authorization header has no Bearer prefix', () => {
    expect(() =>
      controller.select('abc123', { kind: 'pirate', words: [] }),
    ).toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException from listMine when the authorization header is missing', () => {
    expect(() => controller.listMine(undefined)).toThrow(UnauthorizedException);
  });

  it('delegates suggest with the extracted token', async () => {
    await controller.suggest('Bearer abc123');
    expect(questService.suggest).toHaveBeenCalledWith('abc123');
  });

  it('delegates select with the extracted token and body', async () => {
    const dto = {
      kind: 'pirate' as const,
      words: ['treasure', 'storm', 'brave'],
    };
    await controller.select('Bearer abc123', dto);
    expect(questService.select).toHaveBeenCalledWith('abc123', dto);
  });

  it('delegates listMine with the extracted token', async () => {
    await controller.listMine('Bearer abc123');
    expect(questService.listMine).toHaveBeenCalledWith('abc123');
  });
});
