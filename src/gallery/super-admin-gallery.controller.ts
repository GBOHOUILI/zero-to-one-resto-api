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
import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

class UpdateAltTextDto {
  @ApiPropertyOptional() @IsString() @IsOptional() alt_text?: string;
}

const IMG_MAX = 10 * 1024 * 1024;
const IMG_TYPE = /^image\/(jpeg|png|webp|gif)$/;

@ApiTags('Super Admin - Galerie')
@ApiBearerAuth('access-token')
@Roles(Role.SUPER_ADMIN)
@Controller('super-admin/restaurants/:restaurantId/gallery')
export class SuperAdminGalleryController {
  constructor(private readonly svc: GalleryService) {}

  @Get()
  @ApiOperation({ summary: "Galerie d'un restaurant" })
  findAll(@Param('restaurantId') resId: string) {
    return this.svc.findAll(resId);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Uploader des images pour un restaurant' })
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
    @Param('restaurantId') resId: string,
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
  @ApiOperation({ summary: "Modifier l'alt text d'une image" })
  updateAltText(
    @Param('restaurantId') resId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAltTextDto,
  ) {
    return this.svc.updateAltText(id, resId, dto.alt_text ?? '');
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Réorganiser la galerie' })
  reorder(
    @Param('restaurantId') resId: string,
    @Body() dto: ReorderGalleryDto,
  ) {
    return this.svc.reorder(resId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une image' })
  remove(@Param('restaurantId') resId: string, @Param('id') id: string) {
    return this.svc.remove(id, resId);
  }

  @Delete()
  @ApiOperation({ summary: "Vider la galerie d'un restaurant" })
  removeAll(@Param('restaurantId') resId: string) {
    return this.svc.removeAll(resId);
  }
}
