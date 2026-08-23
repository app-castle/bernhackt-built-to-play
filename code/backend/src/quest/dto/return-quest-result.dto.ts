import { ReturnPetTrainingDto } from '../../pet/dto/return-pet-training.dto';
import { QuestKind } from '../quest-kind';
import { QuestStat } from '../quest-reward';

export class ReturnQuestResultDto extends ReturnPetTrainingDto {
  id: string;
  kind: QuestKind;
  words: string[];
  outcomeText: string;
  outcomeScore: number;
  rewardedStat: QuestStat;
  rewardAmount: number;
  createdAt: Date;
}
