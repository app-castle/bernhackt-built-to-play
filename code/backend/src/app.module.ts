import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import databaseConfig from './config/database.config';
import { validate } from './config/env.validation';
import { BattleModule } from './battle/battle.module';
import { PetActivityModule } from './pet-activity/pet-activity.module';
import { PetSittingModule } from './pet-sitting/pet-sitting.module';
import { PetModule } from './pet/pet.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('database.host'),
        port: config.get('database.port'),
        username: config.get('database.username'),
        password: config.get('database.password'),
        database: config.get('database.name'),
        autoLoadEntities: true,
        synchronize: config.get('database.synchronize'),
      }),
    }),
    PetModule,
    PetActivityModule,
    BattleModule,
    PetSittingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
