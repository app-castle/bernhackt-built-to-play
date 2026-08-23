import { ConfigService } from '@nestjs/config';
import { QuestAiService } from './quest-ai.service';

interface FakeAnthropicRequest {
  messages: { content: string }[];
}

interface FakeAnthropicResponse {
  parsed_output: { narrative: string; outcomeScore: number } | null;
}

const parseMock = jest.fn<
  Promise<FakeAnthropicResponse>,
  [FakeAnthropicRequest]
>();

jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { parse: parseMock },
    })),
  };
});

describe('QuestAiService', () => {
  let service: QuestAiService;

  beforeEach(() => {
    parseMock.mockReset();
    const config = { get: jest.fn().mockReturnValue('test-api-key') };
    service = new QuestAiService(config as unknown as ConfigService);
  });

  it('includes the kind, words, pet name, and pet level in the prompt', async () => {
    parseMock.mockResolvedValue({
      parsed_output: { narrative: 'A fine tale.', outcomeScore: 80 },
    });

    await service.generateOutcome({
      kind: 'pirate',
      words: ['treasure', 'storm', 'brave'],
      petName: 'Rex',
      petLevel: 3,
    });

    const call = parseMock.mock.calls[0][0];
    const prompt = call.messages[0].content;
    expect(prompt).toContain('pirate');
    expect(prompt).toContain('treasure');
    expect(prompt).toContain('storm');
    expect(prompt).toContain('brave');
    expect(prompt).toContain('Rex');
    expect(prompt).toContain('3');
  });

  it('clamps an out-of-range outcomeScore from the model', async () => {
    parseMock.mockResolvedValue({
      parsed_output: { narrative: 'Too good to be true.', outcomeScore: 150 },
    });

    const result = await service.generateOutcome({
      kind: 'space',
      words: ['orbit', 'drift', 'nebula'],
      petName: 'Nova',
      petLevel: 1,
    });

    expect(result.outcomeScore).toBe(100);
  });

  it('clamps a negative outcomeScore from the model', async () => {
    parseMock.mockResolvedValue({
      parsed_output: { narrative: 'A disaster.', outcomeScore: -30 },
    });

    const result = await service.generateOutcome({
      kind: 'space',
      words: ['orbit', 'drift', 'nebula'],
      petName: 'Nova',
      petLevel: 1,
    });

    expect(result.outcomeScore).toBe(0);
  });

  it('throws when the response cannot be parsed', async () => {
    parseMock.mockResolvedValue({ parsed_output: null });

    await expect(
      service.generateOutcome({
        kind: 'jungle',
        words: ['vine', 'echo', 'wander'],
        petName: 'Leaf',
        petLevel: 2,
      }),
    ).rejects.toThrow('Quest AI returned an unparseable response');
  });

  it('propagates a rejected API call', async () => {
    parseMock.mockRejectedValue(new Error('network error'));

    await expect(
      service.generateOutcome({
        kind: 'arctic',
        words: ['frost', 'howl', 'silent'],
        petName: 'Frosty',
        petLevel: 1,
      }),
    ).rejects.toThrow('network error');
  });
});
