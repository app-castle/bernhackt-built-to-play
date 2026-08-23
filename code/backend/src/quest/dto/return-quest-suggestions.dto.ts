import { QuestKind } from '../quest-kind';

export class QuestSuggestionDto {
  kind: QuestKind;
  words: string[];
}

export class ReturnQuestSuggestionsDto {
  suggestions: QuestSuggestionDto[];
}
