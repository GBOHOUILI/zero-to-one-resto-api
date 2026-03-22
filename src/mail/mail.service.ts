// src/mail/mail.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendRestaurantCreationEmails(
    superAdminEmail: string,
    restoAdminEmail: string,
    restaurant: any,
    tempPassword: string,
  ) {
    try {
      // Email au RESTO_ADMIN
      await this.transporter.sendMail({
        from: `"Zero To One" <${process.env.EMAIL_USER}>`,
        to: restoAdminEmail,
        subject: `Bienvenue - Accès à ${restaurant.name}`,
        text: `
Bonjour,

Votre compte RESTO_ADMIN a été créé.

Email: ${restoAdminEmail}
Mot de passe temporaire: ${tempPassword}

Connectez-vous : http://localhost:3000/login (ou ton URL)
Changez votre mot de passe dès que possible !

Équipe Zero To One
        `,
      });

      // Email notification au SUPER_ADMIN
      await this.transporter.sendMail({
        from: `"Zero To One" <${process.env.EMAIL_USER}>`,
        to: superAdminEmail,
        subject: `Nouveau restaurant : ${restaurant.name}`,
        text: `Restaurant créé avec succès : ${restaurant.name} (ID: ${restaurant.id})`,
      });

      console.log('Emails envoyés avec succès');
    } catch (error) {
      console.error('Erreur envoi email :', error);
      // Ne bloque pas la création → juste log pour l'instant
    }
  }
  async sendResetPasswordEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"Zero To One" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto;">
            <h3>Réinitialisation de mot de passe</h3>
            <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte <strong>Zero To One</strong>.</p>
            <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure.</p>
            <div style="margin: 30px 0;">
              <a href="${resetLink}" style="padding: 12px 24px; background-color: #E67E22; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser mon mot de passe</a>
            </div>
            <p style="font-size: 0.8em; color: #7f8c8d;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          </div>
        `,
      });
      return { success: true };
    } catch (error) {
      console.error('Erreur envoi email reset :', error);
      throw new InternalServerErrorException(
        "Échec de l'envoi de l'email de réinitialisation",
      );
    }
  }
}
