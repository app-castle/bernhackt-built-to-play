export const QUEST_KINDS = [
  'pirate',
  'western',
  'space',
  'jungle',
  'arctic',
  'desert',
  'underwater',
  'haunted',
  'volcano',
  'cyberpunk',
] as const;

export type QuestKind = (typeof QUEST_KINDS)[number];
