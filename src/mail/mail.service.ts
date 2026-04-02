// src/mail/mail.service.ts
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  // Palette verte professionnelle
  private readonly colors = {
    primary: '#16A34A', // Vert principal
    primaryDark: '#15803D', // Vert foncé (hover/accents)
    primaryLight: '#DCFCE7', // Vert très clair (backgrounds)
    accent: '#22C55E', // Vert vif (highlights)
    dark: '#111827', // Texte principal
    muted: '#6B7280', // Texte secondaire
    border: '#E5E7EB', // Bordures
    surface: '#F9FAFB', // Fond neutre
    danger: '#DC2626', // Rouge erreur/urgent
    warning: '#D97706', // Ambre avertissement
  };

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // ─── Layout principal ────────────────────────────────────────────────────────
  private wrap(
    htmlContent: string,
    options?: { accentColor?: string },
  ): string {
    const accent = options?.accentColor || this.colors.primary;
    const year = new Date().getFullYear();

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Zero To One</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4F6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- ── Header ── -->
          <tr>
            <td style="
              background: linear-gradient(135deg, ${this.colors.primaryDark} 0%, ${this.colors.primary} 60%, ${this.colors.accent} 100%);
              border-radius: 12px 12px 0 0;
              padding: 32px 40px;
              text-align: center;
            ">
              <!-- Logo / wordmark -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <div style="display:inline-block;">
                      <span style="
                        font-size: 11px;
                        font-weight: 700;
                        letter-spacing: 4px;
                        text-transform: uppercase;
                        color: rgba(255,255,255,0.65);
                        display: block;
                        margin-bottom: 4px;
                      ">Plateforme SaaS</span>
                      <span style="
                        font-size: 28px;
                        font-weight: 800;
                        color: #ffffff;
                        letter-spacing: -0.5px;
                        display: block;
                      ">Zero To One</span>
                      <div style="
                        width: 40px;
                        height: 3px;
                        background: rgba(255,255,255,0.4);
                        margin: 10px auto 0;
                        border-radius: 2px;
                      "></div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="
              background-color: #ffffff;
              padding: 40px;
              border-left: 1px solid ${this.colors.border};
              border-right: 1px solid ${this.colors.border};
            ">
              ${htmlContent}
            </td>
          </tr>

          <!-- ── Footer ── -->
          <tr>
            <td style="
              background-color: ${this.colors.surface};
              border: 1px solid ${this.colors.border};
              border-top: none;
              border-radius: 0 0 12px 12px;
              padding: 24px 40px;
              text-align: center;
            ">
              <p style="margin:0 0 8px;font-size:12px;color:${this.colors.muted};">
                Restauration Digitale au Bénin &nbsp;·&nbsp; Cotonou, BJ
              </p>
              <p style="margin:0;font-size:11px;color:#9CA3AF;">
                &copy; ${year} Zero To One. Tous droits réservés.
              </p>
              <div style="margin-top:16px;">
                <a href="${process.env.FRONTEND_URL}" style="font-size:11px;color:${this.colors.primary};text-decoration:none;margin:0 8px;">Tableau de bord</a>
                <span style="color:${this.colors.border};">|</span>
                <a href="${process.env.FRONTEND_URL}/support" style="font-size:11px;color:${this.colors.primary};text-decoration:none;margin:0 8px;">Support</a>
                <span style="color:${this.colors.border};">|</span>
                <a href="${process.env.FRONTEND_URL}/privacy" style="font-size:11px;color:${this.colors.primary};text-decoration:none;margin:0 8px;">Confidentialité</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
  }

  // ─── Bouton CTA réutilisable ─────────────────────────────────────────────────
  private ctaButton(text: string, href: string, color?: string): string {
    const bg = color || this.colors.primary;
    return `
      <table cellpadding="0" cellspacing="0" style="margin: 28px 0;">
        <tr>
          <td style="border-radius:8px;background-color:${bg};">
            <a href="${href}" style="
              display: inline-block;
              padding: 14px 32px;
              font-size: 15px;
              font-weight: 700;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              letter-spacing: 0.3px;
            ">${text} &rarr;</a>
          </td>
        </tr>
      </table>`;
  }

  // ─── Boîte info / credentials ────────────────────────────────────────────────
  private infoBox(rows: { label: string; value: string }[]): string {
    const rowsHtml = rows
      .map(
        (r) => `
      <tr>
        <td style="padding:8px 16px;font-size:13px;color:${this.colors.muted};width:130px;white-space:nowrap;">${r.label}</td>
        <td style="padding:8px 16px;font-size:13px;color:${this.colors.dark};font-weight:600;font-family:monospace;">${r.value}</td>
      </tr>`,
      )
      .join('');

    return `
      <table cellpadding="0" cellspacing="0" style="
        background-color:${this.colors.primaryLight};
        border-left: 4px solid ${this.colors.primary};
        border-radius: 0 8px 8px 0;
        width:100%;
        margin: 24px 0;
      ">
        ${rowsHtml}
      </table>`;
  }

  // ─── Badge statut ────────────────────────────────────────────────────────────
  private badge(text: string, color: string): string {
    return `<span style="
      display:inline-block;
      background-color:${color}18;
      color:${color};
      border:1px solid ${color}40;
      border-radius:20px;
      font-size:11px;
      font-weight:700;
      letter-spacing:1px;
      text-transform:uppercase;
      padding:4px 12px;
      margin-bottom:20px;
    ">${text}</span>`;
  }

  // ─── Envoi générique ─────────────────────────────────────────────────────────
  private async sendHtmlEmail(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: `"Zero To One" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Échec envoi mail à ${to}: ${error.message}`);
      throw new InternalServerErrorException(
        'Erreur de notification par email',
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. EMAIL DE BIENVENUE
  // ─────────────────────────────────────────────────────────────────────────────
  async sendWelcomeEmail(
    email: string,
    restaurantName: string,
    tempPassword: string,
  ) {
    const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

    const body = `
      ${this.badge('Compte activé', this.colors.primary)}
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${this.colors.dark};">
        Bienvenue, ${restaurantName} !
      </h2>
      <p style="margin:0 0 20px;font-size:15px;color:${this.colors.muted};line-height:1.6;">
        Votre espace Zero To One est prêt. Voici vos identifiants temporaires pour votre première connexion.
      </p>

      ${this.infoBox([
        { label: 'Adresse e-mail', value: email },
        { label: 'Mot de passe', value: tempPassword },
      ])}

      ${this.ctaButton('Accéder à mon tableau de bord', loginUrl)}

      <table cellpadding="0" cellspacing="0" style="
        background-color:#FFFBEB;
        border-left:4px solid ${this.colors.warning};
        border-radius:0 8px 8px 0;
        width:100%;
        margin-top:8px;
      ">
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:#92400E;line-height:1.5;">
            <strong>⚠ Important :</strong> Changez votre mot de passe dès votre première connexion depuis les paramètres de votre compte.
          </td>
        </tr>
      </table>`;

    await this.sendHtmlEmail(
      email,
      `🎉 Bienvenue sur Zero To One — ${restaurantName}`,
      this.wrap(body),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. RÉINITIALISATION DE MOT DE PASSE
  // ─────────────────────────────────────────────────────────────────────────────
  async sendResetPasswordEmail(email: string, token: string) {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const body = `
      ${this.badge('Sécurité', this.colors.warning)}
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${this.colors.dark};">
        Réinitialiser votre mot de passe
      </h2>
      <p style="margin:0 0 20px;font-size:15px;color:${this.colors.muted};line-height:1.6;">
        Nous avons reçu une demande de réinitialisation pour le compte associé à <strong>${email}</strong>.
        Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
      </p>

      ${this.ctaButton('Réinitialiser mon mot de passe', resetLink, this.colors.warning)}

      <table cellpadding="0" cellspacing="0" style="
        background-color:${this.colors.surface};
        border:1px solid ${this.colors.border};
        border-radius:8px;
        width:100%;
        margin-top:8px;
      ">
        <tr>
          <td style="padding:14px 16px;font-size:13px;color:${this.colors.muted};line-height:1.6;">
            🕐 Ce lien expire dans <strong>1 heure</strong>.<br/>
            Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail — votre compte reste sécurisé.
          </td>
        </tr>
      </table>`;

    await this.sendHtmlEmail(
      email,
      '🔐 Réinitialisation de votre mot de passe — Zero To One',
      this.wrap(body, { accentColor: this.colors.warning }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. EXPIRATION D'ABONNEMENT
  // ─────────────────────────────────────────────────────────────────────────────
  async sendSubscriptionExpiredEmail(email: string, restaurantName: string) {
    const billingUrl = `${process.env.FRONTEND_URL}/dashboard/billing`;

    const body = `
      ${this.badge('Action requise', this.colors.danger)}
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${this.colors.dark};">
        Votre abonnement a expiré
      </h2>
      <p style="margin:0 0 20px;font-size:15px;color:${this.colors.muted};line-height:1.6;">
        L'abonnement de <strong>${restaurantName}</strong> est arrivé à son terme.
        Votre menu digital n'est plus accessible publiquement.
      </p>

      <table cellpadding="0" cellspacing="0" style="width:100%;margin:24px 0;">
        <tr>
          <td style="width:50%;padding-right:8px;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" style="
              width:100%;background:#FEF2F2;border-radius:8px;border:1px solid #FECACA;
            ">
              <tr><td style="padding:16px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#EF4444;">Actuellement</p>
                <p style="margin:0;font-size:14px;color:#991B1B;">Menu hors-ligne</p>
              </td></tr>
            </table>
          </td>
          <td style="width:50%;padding-left:8px;vertical-align:top;">
            <table cellpadding="0" cellspacing="0" style="
              width:100%;background:${this.colors.primaryLight};border-radius:8px;border:1px solid #BBF7D0;
            ">
              <tr><td style="padding:16px;">
                <p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${this.colors.primary};">Après renouvellement</p>
                <p style="margin:0;font-size:14px;color:${this.colors.primaryDark};">Menu en ligne ✓</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>

      ${this.ctaButton('Renouveler mon abonnement', billingUrl, this.colors.danger)}

      <p style="margin:0;font-size:13px;color:${this.colors.muted};line-height:1.6;">
        Besoin d'aide ? Contactez notre équipe à
        <a href="mailto:support@zerotoone.bj" style="color:${this.colors.primary};text-decoration:none;font-weight:600;">support@zerotoone.bj</a>
      </p>`;

    await this.sendHtmlEmail(
      email,
      `⚠️ Abonnement expiré — ${restaurantName}`,
      this.wrap(body, { accentColor: this.colors.danger }),
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. NOTIFICATION NOUVELLE COMMANDE (pour le proprio du restaurant)
  // ─────────────────────────────────────────────────────────────────────────────
  async sendNewOrderNotification(
    ownerEmail: string,
    restaurantName: string,
    order: {
      short_id: string;
      total_amount: number;
      note?: string | null;
      customer_phone?: string | null;
      items: Array<{
        name: string;
        quantity: number;
        unit_price: number;
        subtotal: number;
      }>;
    },
  ) {
    const dashboardUrl = `${process.env.FRONTEND_URL}/dashboard/orders`;

    const itemsRows = order.items
      .map(
        (item) => `
          <tr>
            <td style="padding:10px 16px;font-size:14px;color:${this.colors.dark};border-bottom:1px solid ${this.colors.border};">
              ${item.name}
            </td>
            <td style="padding:10px 16px;font-size:14px;color:${this.colors.muted};text-align:center;border-bottom:1px solid ${this.colors.border};">
              x${item.quantity}
            </td>
            <td style="padding:10px 16px;font-size:14px;color:${this.colors.dark};text-align:right;font-weight:600;border-bottom:1px solid ${this.colors.border};">
              ${item.subtotal.toLocaleString('fr-FR')} FCFA
            </td>
          </tr>`,
      )
      .join('');

    const body = `
        ${this.badge('Nouvelle Commande', this.colors.primary)}
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:${this.colors.dark};">
          Commande #${order.short_id}
        </h2>
        <p style="margin:0 0 24px;font-size:15px;color:${this.colors.muted};line-height:1.6;">
          <strong>${restaurantName}</strong> vient de recevoir une commande via votre menu digital.
        </p>

        <!-- Tableau des articles -->
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid ${this.colors.border};border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <tr style="background-color:${this.colors.surface};">
            <th style="padding:10px 16px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${this.colors.muted};text-align:left;">Article</th>
            <th style="padding:10px 16px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${this.colors.muted};text-align:center;">Qté</th>
            <th style="padding:10px 16px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${this.colors.muted};text-align:right;">Sous-total</th>
          </tr>
          ${itemsRows}
          <tr style="background-color:${this.colors.primaryLight};">
            <td colspan="2" style="padding:12px 16px;font-size:15px;font-weight:700;color:${this.colors.primaryDark};">TOTAL</td>
            <td style="padding:12px 16px;font-size:15px;font-weight:800;color:${this.colors.primaryDark};text-align:right;">
              ${order.total_amount.toLocaleString('fr-FR')} FCFA
            </td>
          </tr>
        </table>

        <!-- Infos client -->
        ${this.infoBox([
          { label: 'Référence', value: `#${order.short_id}` },
          ...(order.customer_phone
            ? [{ label: 'Téléphone', value: order.customer_phone }]
            : []),
          ...(order.note ? [{ label: 'Note client', value: order.note }] : []),
        ])}

        ${this.ctaButton('Voir mes commandes', dashboardUrl)}

        <p style="margin:0;font-size:13px;color:${this.colors.muted};line-height:1.6;">
          Le client a été redirigé vers votre WhatsApp avec le détail de la commande.
          Confirmez la commande directement sur WhatsApp.
        </p>`;

    await this.sendHtmlEmail(
      ownerEmail,
      `🔔 Nouvelle commande #${order.short_id} — ${restaurantName}`,
      this.wrap(body),
    );
  }
}
