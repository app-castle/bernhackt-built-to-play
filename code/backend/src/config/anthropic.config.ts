import { registerAs } from '@nestjs/config';

export default registerAs('anthropic', () => ({
  apiKey: process.env.ANTHROPIC_API_KEY,
}));
