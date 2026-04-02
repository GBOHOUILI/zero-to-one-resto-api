import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v2 as cloudinary } from 'cloudinary';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Cron quotidien à 02h00 UTC
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runDailyBackup() {
    this.logger.log('🗄️  Démarrage backup quotidien...');
    try {
      const result = await this.performBackup();
      this.logger.log(
        `✅ Backup terminé : ${result.filename} (${result.size})`,
      );
    } catch (error) {
      this.logger.error('❌ Backup échoué', error);
    }
  }

  // ─── Backup manuel (déclenché via endpoint super admin) ──────────────────
  async triggerManualBackup() {
    this.logger.log('🗄️  Backup manuel déclenché...');
    return this.performBackup();
  }

  // ─── Logique principale ───────────────────────────────────────────────────
  private async performBackup(): Promise<{
    filename: string;
    url: string;
    size: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const localPath = join(tmpdir(), filename);

    // 1. Dump PostgreSQL (Supabase)
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) throw new Error('DATABASE_URL non défini');

    await execAsync(`pg_dump "${dbUrl}" -F p -f "${localPath}"`, {
      timeout: 5 * 60 * 1000, // timeout 5 min
    });

    // 2. Lire le fichier dump
    const { readFile } = await import('fs/promises');
    const fileBuffer = await readFile(localPath);
    const fileSizeKB = (fileBuffer.length / 1024).toFixed(1);

    // 3. Upload vers Cloudinary (dossier backups, type raw)
    const uploadResult = await new Promise<{ secure_url: string }>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              folder: 'zero-to-one/backups',
              resource_type: 'raw',
              public_id: filename,
              // Expire automatiquement après 30 jours
              invalidate: true,
            },
            (error, result) => {
              if (error) return reject(error);
              if (!result) return reject(new Error('Upload backup échoué'));
              resolve(result);
            },
          )
          .end(fileBuffer);
      },
    );

    // 4. Nettoyage fichier temporaire
    await unlink(localPath).catch(() => {});

    // 5. Nettoyer les vieux backups (garder 30 derniers)
    await this.pruneOldBackups().catch(() => {});

    return {
      filename,
      url: uploadResult.secure_url,
      size: `${fileSizeKB} KB`,
    };
  }

  // ─── Garder seulement les 30 derniers backups ─────────────────────────────
  private async pruneOldBackups() {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: 'zero-to-one/backups/',
      max_results: 100,
    });

    const sorted = (result.resources as any[]).sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    const toDelete = sorted.slice(30); // Supprimer tout au-delà de 30
    for (const resource of toDelete) {
      await cloudinary.uploader
        .destroy(resource.public_id, { resource_type: 'raw' })
        .catch(() => {});
    }

    if (toDelete.length > 0) {
      this.logger.log(`🧹 ${toDelete.length} ancien(s) backup(s) supprimé(s)`);
    }
  }

  // ─── Lister les backups disponibles ──────────────────────────────────────
  async listBackups() {
    const result = await cloudinary.api.resources({
      type: 'upload',
      resource_type: 'raw',
      prefix: 'zero-to-one/backups/',
      max_results: 30,
    });

    return (result.resources as any[])
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .map((r) => ({
        filename: r.public_id.split('/').pop(),
        url: r.secure_url,
        size: `${(r.bytes / 1024).toFixed(1)} KB`,
        created_at: r.created_at,
      }));
  }
}
