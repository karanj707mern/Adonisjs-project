import nodemailer from 'nodemailer'
import Handlebars from 'handlebars'
import { readFileSync } from 'fs'
import { join } from 'path'

export class MailService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  async sendEmail(to: string, subject: string, templateName: string, data: Record<string, any>) {
    const templatePath = join(process.cwd(), 'email-templates', `${templateName}.hbs`)
    const templateSource = readFileSync(templatePath, 'utf-8')
    const template = Handlebars.compile(templateSource)
    const html = template(data)

    const text = Handlebars.compile(
      readFileSync(join(process.cwd(), 'email-templates', `${templateName}.text.hbs`), 'utf-8')
    )(data)

    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
    })
  }

  async sendRawEmail(to: string, subject: string, html: string, text?: string) {
    await this.transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text,
    })
  }
}
