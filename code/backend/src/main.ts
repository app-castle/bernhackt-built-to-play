import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Request, Response } from 'express';
import { AppModule } from './app.module';

const server = express();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));

  app.enableCors({
    origin: '*',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.init();

  return app;
}

const ready = bootstrap();

if (require.main === module) {
  ready.then((app) => app.listen(process.env.PORT ?? 3000));
}

export default async function handler(req: Request, res: Response) {
  await ready;
  server(req, res);
}
