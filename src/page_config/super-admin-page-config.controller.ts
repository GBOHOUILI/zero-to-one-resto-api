import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PageConfigService } from './page-config.service';
import { UpdatePageConfigDto } from './dto/update-page-config.dto';
import { UploadHeroMediaDto } from './dto/upload-hero-media.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';

const HERO_MAX_SIZE = 50 * 1024 * 1024;
const HERO_FILE_TYPE =
  /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime))$/;

@ApiTags('Super Admin - Page Config')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/restaurants/:restaurantId/page-config')
export class SuperAdminPageConfigController {
  constructor(private readonly svc: PageConfigService) {}

  @Get()
  @ApiOperation({ summary: "Toutes les configs de pages d'un restaurant" })
  getAll(@Param('restaurantId') resId: string) {
    return this.svc.getAll(resId);
  }

  @Get(':pageSlug')
  @ApiOperation({ summary: "Config d'une page spécifique" })
  getOne(
    @Param('restaurantId') resId: string,
    @Param('pageSlug') pageSlug: string,
  ) {
    return this.svc.getOne(resId, pageSlug);
  }

  @Patch(':pageSlug')
  @ApiOperation({ summary: "Mettre à jour la config d'une page" })
  update(
    @Param('restaurantId') resId: string,
    @Param('pageSlug') pageSlug: string,
    @Body() dto: UpdatePageConfigDto,
  ) {
    return this.svc.update(resId, pageSlug, dto);
  }

  @Post(':pageSlug/hero-media')
  @ApiOperation({ summary: "Uploader le média hero d'un restaurant" })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: HERO_MAX_SIZE } }),
  )
  uploadHeroMedia(
    @Param('restaurantId') resId: string,
    @Param('pageSlug') pageSlug: string,
    @Body() dto: UploadHeroMediaDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: HERO_MAX_SIZE }),
          new FileTypeValidator({ fileType: HERO_FILE_TYPE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    dto.page_slug = pageSlug;
    return this.svc.uploadHeroMedia(resId, dto, file);
  }

  @Delete(':pageSlug/hero-media')
  @ApiOperation({ summary: 'Supprimer le média hero' })
  removeHeroMedia(
    @Param('restaurantId') resId: string,
    @Param('pageSlug') pageSlug: string,
  ) {
    return this.svc.removeHeroMedia(resId, pageSlug);
  }

  @Delete(':pageSlug')
  @ApiOperation({ summary: "Supprimer toute la config d'une page" })
  delete(
    @Param('restaurantId') resId: string,
    @Param('pageSlug') pageSlug: string,
  ) {
    return this.svc.delete(resId, pageSlug);
  }
}
