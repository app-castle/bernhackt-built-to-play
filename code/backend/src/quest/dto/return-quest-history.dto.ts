import { QuestKind } from '../quest-kind';
import { QuestStat } from '../quest-reward';

export class ReturnQuestHistoryDto {
  id: string;
  kind: QuestKind;
  words: string[];
  outcomeText: string;
  outcomeScore: number;
  rewardedStat: QuestStat;
  rewardAmount: number;
  createdAt: Date;
}
