// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
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
    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: `"Zero To One" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Réinitialisation de votre mot de passe',
        html: `
          <h3>Réinitialisation de mot de passe</h3>
          <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte Zero To One.</p>
          <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 1 heure.</p>
          <a href="${resetLink}" style="padding: 10px 20px; background-color: #E67E22; color: white; text-decoration: none; border-radius: 5px;">Réinitialiser mon mot de passe</a>
          <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
        `,
      });
      console.log(`Email de reset envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur envoi email reset :', error);
    }
  }
}
