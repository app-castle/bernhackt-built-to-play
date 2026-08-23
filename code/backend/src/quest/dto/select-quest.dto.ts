import { ArrayMaxSize, ArrayMinSize, IsArray, IsIn } from 'class-validator';
import { QUEST_KINDS, type QuestKind } from '../quest-kind';
import { QUEST_WORDS } from '../quest-word';

export class SelectQuestDto {
  @IsIn(QUEST_KINDS)
  kind: QuestKind;

  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsIn(QUEST_WORDS, { each: true })
  words: string[];
}
