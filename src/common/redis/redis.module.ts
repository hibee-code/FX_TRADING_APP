import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';

const redisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: () => {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    return new Redis(url);
  },
};

@Global()
@Module({
  providers: [redisProvider],
  exports: ['REDIS_CLIENT'],
})
export class RedisModule {}
