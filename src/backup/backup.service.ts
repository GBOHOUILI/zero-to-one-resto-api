import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v2 as cloudinary } from 'cloudinary';
import { PrismaService } from '../../prisma/prisma.service';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly prisma: PrismaService) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runDailyBackup() {
    this.logger.log('🗄️  Démarrage backup quotidien...');
    try {
      const result = await this.performBackup();
      this.logger.log(`✅ Backup terminé : ${result.filename} (${result.size})`);
    } catch (error) {
      this.logger.error('❌ Backup échoué', error);
    }
  }

  async triggerManualBackup() {
    this.logger.log('🗄️  Backup manuel déclenché...');
    return this.performBackup();
  }

  private async performBackup(): Promise<{ filename: string; url: string; size: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pgDumpAvailable = await this.isPgDumpAvailable();

    let fileBuffer: Buffer;
    let filename: string;

    if (pgDumpAvailable) {
      // Prod : pg_dump SQL
      filename = `backup-${timestamp}.sql`;
      const localPath = join(tmpdir(), filename);
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) throw new Error('DATABASE_URL non défini');

      await execAsync(`pg_dump "${dbUrl}" -F p -f "${localPath}"`, {
        timeout: 5 * 60 * 1000,
      });
      fileBuffer = await readFile(localPath);
      await unlink(localPath).catch(() => {});
    } else {
      // Dev fallback : dump JSON via Prisma
      this.logger.warn('⚠️  pg_dump non disponible — fallback Prisma JSON');
      filename = `backup-${timestamp}.json`;
      const data = await this.prismaJsonDump();
      fileBuffer = Buffer.from(JSON.stringify(data, null, 2), 'utf-8');
    }

    const fileSizeKB = (fileBuffer.length / 1024).toFixed(1);

    const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: 'zero-to-one/backups', resource_type: 'raw', public_id: filename, invalidate: true },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error('Upload backup échoué'));
            resolve(result);
          },
        )
        .end(fileBuffer);
    });

    await this.pruneOldBackups().catch(() => {});

    return { filename, url: uploadResult.secure_url, size: `${fileSizeKB} KB` };
  }

  private async isPgDumpAvailable(): Promise<boolean> {
    try {
      await execAsync('pg_dump --version', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  private async prismaJsonDump(): Promise<Record<string, any>> {
    const [restaurants, users, menuCategories, menuItems, subscriptions, payments] =
      await Promise.all([
        this.prisma.restaurant.findMany(),
        this.prisma.user.findMany({ select: { id: true, email: true, role: true, created_at: true } }),
        this.prisma.menuCategory.findMany(),
        this.prisma.menuItem.findMany(),
        this.prisma.subscription.findMany(),
        this.prisma.payment.findMany(),
      ]);

    return {
      meta: {
        backup_type: 'prisma_json_fallback',
        generated_at: new Date().toISOString(),
        note: 'pg_dump non disponible — export via Prisma ORM',
      },
      restaurants,
      users,
      menuCategories,
      menuItems,
      subscriptions,
      payments,
    };
  }

  private async pruneOldBackups() {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: 'zero-to-one/backups/',
      max_results: 100,
    });

    const sorted = (result.resources as any[]).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const toDelete = sorted.slice(30);
    for (const resource of toDelete) {
      await cloudinary.uploader.destroy(resource.public_id, { resource_type: 'raw' }).catch(() => {});
    }
    if (toDelete.length > 0) {
      this.logger.log(`🧹 ${toDelete.length} ancien(s) backup(s) supprimé(s)`);
    }
  }

  async listBackups() {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: 'zero-to-one/backups/',
      max_results: 30,
    });

    return (result.resources as any[])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((r) => ({
        filename: r.public_id.split('/').pop(),
        url: r.secure_url,
        size: `${(r.bytes / 1024).toFixed(1)} KB`,
        created_at: r.created_at,
      }));
  }
}