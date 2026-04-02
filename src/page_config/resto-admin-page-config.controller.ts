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
import { GetUser } from '../common/get-user.decorator';

const HERO_MAX_SIZE = 50 * 1024 * 1024; // 50MB
const HERO_FILE_TYPE =
  /^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime))$/;

@ApiTags('Resto Admin - Page Config')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/page-config')
export class RestoAdminPageConfigController {
  constructor(private readonly svc: PageConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Toutes les configs de pages du restaurant' })
  getAll(@GetUser('restaurantId') resId: string) {
    return this.svc.getAll(resId);
  }

  @Get(':pageSlug')
  @ApiOperation({ summary: "Config d'une page spécifique" })
  getOne(
    @Param('pageSlug') pageSlug: string,
    @GetUser('restaurantId') resId: string,
  ) {
    return this.svc.getOne(resId, pageSlug);
  }

  @Patch(':pageSlug')
  @ApiOperation({
    summary: "Mettre à jour textes/config d'une page (sans fichier)",
  })
  update(
    @Param('pageSlug') pageSlug: string,
    @GetUser('restaurantId') resId: string,
    @Body() dto: UpdatePageConfigDto,
  ) {
    return this.svc.update(resId, pageSlug, dto);
  }

  @Post(':pageSlug/hero-media')
  @ApiOperation({
    summary: 'Uploader/remplacer le média hero (image ou vidéo, max 50MB)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: HERO_MAX_SIZE } }),
  )
  uploadHeroMedia(
    @Param('pageSlug') pageSlug: string,
    @GetUser('restaurantId') resId: string,
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
    dto.page_slug = pageSlug; // Le param URL fait foi
    return this.svc.uploadHeroMedia(resId, dto, file);
  }

  @Delete(':pageSlug/hero-media')
  @ApiOperation({ summary: "Supprimer le média hero d'une page" })
  removeHeroMedia(
    @Param('pageSlug') pageSlug: string,
    @GetUser('restaurantId') resId: string,
  ) {
    return this.svc.removeHeroMedia(resId, pageSlug);
  }

  @Delete(':pageSlug')
  @ApiOperation({ summary: "Supprimer toute la config d'une page" })
  delete(
    @Param('pageSlug') pageSlug: string,
    @GetUser('restaurantId') resId: string,
  ) {
    return this.svc.delete(resId, pageSlug);
  }
}
