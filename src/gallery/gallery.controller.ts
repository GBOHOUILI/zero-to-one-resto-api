import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { GalleryService } from './gallery.service';

@ApiTags('Public - Galerie')
@Public()
@Controller('gallery')
export class PublicGalleryController {
  constructor(private readonly svc: GalleryService) {}

  @Get(':restaurantId')
  @ApiOperation({ summary: 'Images de la galerie triées par position' })
  findAll(@Param('restaurantId') restaurantId: string) {
    return this.svc.findAll(restaurantId);
  }
}
