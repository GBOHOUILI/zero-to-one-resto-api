import { Controller, Post, Body, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { TrackEventDto } from './dto/track-event.dto';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Public - Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('view')
  @ApiOperation({ summary: 'Tracker une visite sur le site' })
  trackView(@Body() dto: TrackEventDto, @Req() req: Request) {
    const ip = req.ip || '0.0.0.0';
    // On force une string si le header est manquant
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';

    return this.analyticsService.track(dto, 'VIEW', ip, userAgent);
  }

  @Post('whatsapp-click')
  @ApiOperation({ summary: 'Tracker un clic sur le bouton WhatsApp' })
  trackWhatsApp(@Body() dto: TrackEventDto, @Req() req: Request) {
    const ip = req.ip || '0.0.0.0';
    const userAgent = (req.headers['user-agent'] as string) || 'unknown';

    return this.analyticsService.track(dto, 'WHATSAPP_CLICK', ip, userAgent);
  }
}
