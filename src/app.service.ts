import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './common/redis/redis.service';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private redis: RedisService) {}

  async onModuleInit() {
    await this.redis.set('test', 'hello', 60);
    const value = await this.redis.get('test');

    console.log('Redis test:', value);
  }

  getHello(): string {
    return 'Hello World!';
  }
}
