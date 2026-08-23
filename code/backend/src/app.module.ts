import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BattleModule } from './battle/battle.module';
import anthropicConfig from './config/anthropic.config';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';
import { PetActivityModule } from './pet-activity/pet-activity.module';
import { PetSittingModule } from './pet-sitting/pet-sitting.module';
import { PetModule } from './pet/pet.module';
import { QuestModule } from './quest/quest.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [databaseConfig, anthropicConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('database.url'),
        autoLoadEntities: true,
        synchronize: config.get('database.synchronize'),
      }),
    }),
    PetModule,
    PetActivityModule,
    BattleModule,
    PetSittingModule,
    QuestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
