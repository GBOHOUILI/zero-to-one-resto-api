// src/shared/shared.module.ts   (crée ce fichier si pas déjà fait)
import { Module, Global } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

@Global() // ← rend PrismaService et MailService injectables partout sans import
@Module({
  providers: [PrismaService, MailService],
  exports: [PrismaService, MailService],
})
export class SharedModule {}
