import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PetModule } from '../pet/pet.module';
import { baseQuestTemplate } from './config/base-quest.template';
import { QUEST_TEMPLATE } from './config/quest-template.token';
import { Quest } from './entities/quest.entity';
import { QuestAiService } from './quest-ai.service';
import { QuestController } from './quest.controller';
import { QuestService } from './quest.service';

@Module({
  imports: [TypeOrmModule.forFeature([Quest]), PetModule],
  controllers: [QuestController],
  providers: [
    QuestService,
    QuestAiService,
    { provide: QUEST_TEMPLATE, useValue: baseQuestTemplate },
  ],
})
export class QuestModule {}
