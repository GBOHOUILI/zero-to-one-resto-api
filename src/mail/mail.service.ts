// src/mail/mail.service.ts (exemple minimal avec console.log fallback)
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
}
