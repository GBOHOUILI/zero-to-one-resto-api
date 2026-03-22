import { Injectable } from '@nestjs/common';
import * as dns from 'dns/promises';

@Injectable()
export class DomainValidationService {
  private readonly TARGET_CNAME = 'zero-to-one.bj';
  private readonly TARGET_IP = '1.2.3.4';

  async validateConfig(domain: string): Promise<boolean> {
    try {
      const cnames: string[] = await dns.resolveCname(domain).catch(() => []);

      if (cnames.includes(this.TARGET_CNAME)) return true;

      const addresses: string[] = await dns.resolve4(domain).catch(() => []);

      if (addresses.includes(this.TARGET_IP)) return true;

      return false;
    } catch (e) {
      return false;
    }
  }
}
