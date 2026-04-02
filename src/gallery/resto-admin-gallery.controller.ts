import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { GalleryService } from './gallery.service';
import { ReorderGalleryDto } from './dto/reorder-gallery.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/role.enum';
import { GetUser } from '../common/get-user.decorator';
import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateAltTextDto {
  @ApiPropertyOptional() @IsString() @IsOptional() alt_text?: string;
}

const IMG_MAX = 10 * 1024 * 1024; // 10MB par image
const IMG_TYPE = /^image\/(jpeg|png|webp|gif)$/;

@ApiTags('Resto Admin - Galerie')
@ApiBearerAuth('access-token')
@Roles(Role.RESTO_ADMIN)
@Controller('resto-admin/gallery')
export class RestoAdminGalleryController {
  constructor(private readonly svc: GalleryService) {}

  @Get()
  @ApiOperation({ summary: 'Toutes les images de la galerie (triées)' })
  findAll(@GetUser('restaurantId') resId: string) {
    return this.svc.findAll(resId);
  }

  @Post('upload')
  @ApiOperation({
    summary: 'Uploader 1 à 20 images (multipart, champ "files")',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array', items: { type: 'string', format: 'binary' } },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 20, { limits: { fileSize: IMG_MAX } }),
  )
  upload(
    @GetUser('restaurantId') resId: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: IMG_MAX }),
          new FileTypeValidator({ fileType: IMG_TYPE }),
        ],
        fileIsRequired: true,
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.svc.uploadMany(resId, files);
  }

  @Patch(':id/alt-text')
  @ApiOperation({ summary: "Modifier le texte alternatif d'une image" })
  updateAltText(
    @Param('id') id: string,
    @GetUser('restaurantId') resId: string,
    @Body() dto: UpdateAltTextDto,
  ) {
    return this.svc.updateAltText(id, resId, dto.alt_text ?? '');
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Réorganiser la galerie (drag & drop)' })
  reorder(
    @GetUser('restaurantId') resId: string,
    @Body() dto: ReorderGalleryDto,
  ) {
    return this.svc.reorder(resId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une image et son fichier Cloudinary' })
  remove(@Param('id') id: string, @GetUser('restaurantId') resId: string) {
    return this.svc.remove(id, resId);
  }

  @Delete()
  @ApiOperation({ summary: 'Vider toute la galerie' })
  removeAll(@GetUser('restaurantId') resId: string) {
    return this.svc.removeAll(resId);
  }
}
