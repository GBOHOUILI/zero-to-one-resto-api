import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SubscriptionsService } from './subscriptions.service';

@Injectable()
export class SubscriptionScheduler {
  private readonly logger = new Logger(SubscriptionScheduler.name);

  constructor(private subService: SubscriptionsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Vérification des abonnements expirés...');
    const result = await this.subService.checkExpirations();
    this.logger.log(`${result.count} abonnements passés en EXPIRED.`);
  }
}
