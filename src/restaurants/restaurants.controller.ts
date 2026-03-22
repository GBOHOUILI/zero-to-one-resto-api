import { Controller, Get, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { TenantService } from '../tenants/tenant.service';
import { Public } from '../auth/public.decorator';
import { Role } from '../auth/role.enum';
import { MailService } from '../mail/mail.service';

@ApiTags('Client - Consultation')
@Controller('restaurants')
export class RestaurantsController {
  constructor(
    private readonly restaurantsService: RestaurantsService,
    private readonly tenantService: TenantService,
    private readonly mailService: MailService,
  ) {}

  @Get('public')
  @Public()
  async getPublic(@Req() req) {
    const host = req.headers.host;
    const tenantId = await this.tenantService.resolveTenant(host);

    if (!tenantId) {
      throw new NotFoundException('Aucun restaurant trouvé');
    }

    return this.restaurantsService.getById(tenantId, 'SUPER_ADMIN', tenantId);
  }

  @Get('test-email')
  @Public()
  async testEmail() {
    return await this.mailService.sendWelcomeEmail(
      'eldomoreo@gmail.com',
      'Mon Super Resto',
      'PASS1234',
    );
  }
}
