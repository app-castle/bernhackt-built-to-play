import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod/v4';
import { QuestKind } from './quest-kind';
import { clampOutcomeScore } from './quest-reward';

const QuestOutcomeSchema = z.object({
  narrative: z.string(),
  outcomeScore: z.number(),
});

export interface QuestOutcomeInput {
  kind: QuestKind;
  words: string[];
  petName: string;
  petLevel: number;
}

export interface QuestOutcomeResult {
  narrative: string;
  outcomeScore: number;
}

@Injectable()
export class QuestAiService {
  private readonly client: Anthropic;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.client = new Anthropic({ apiKey: config.get('anthropic.apiKey') });
  }

  async generateOutcome(input: QuestOutcomeInput): Promise<QuestOutcomeResult> {
    const response = await this.client.messages.parse({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: this.buildPrompt(input) }],
      output_config: { format: zodOutputFormat(QuestOutcomeSchema) },
    });

    if (!response.parsed_output) {
      throw new Error('Quest AI returned an unparseable response');
    }

    return {
      narrative: response.parsed_output.narrative,
      outcomeScore: clampOutcomeScore(response.parsed_output.outcomeScore),
    };
  }

  private buildPrompt(input: QuestOutcomeInput): string {
    return (
      `Write a short (2-4 sentence) quest outcome for a virtual pet named ` +
      `${input.petName} (level ${input.petLevel}) on a ${input.kind}-themed ` +
      `quest featuring these three elements: ${input.words.join(', ')}. ` +
      `Then rate how well the quest went on a scale from 0 (disaster) to ` +
      `100 (legendary success).`
    );
  }
}
