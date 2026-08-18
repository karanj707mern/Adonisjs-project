import { PrismaClient } from '@prisma/client';
import * as Handlebars from 'handlebars';
import * as fs from 'node:fs';
import * as path from 'node:path';
import env from '#start/env';
import { sanitizeHtml } from '#lib/sanitize';

export interface EmailTemplateRecord {
  id: number;
  name: string;
  subject: string;
  htmlBody: string;
  textBody: string | null;
  variables: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default class EmailTemplateService {
  private readonly templateDir: string;
  private readonly cache = new Map<string, Handlebars.TemplateDelegate>();
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.templateDir = path.join(process.cwd(), 'email-templates');
  }

  async getAll(): Promise<EmailTemplateRecord[]> {
    return this.prisma.emailTemplate.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: number): Promise<EmailTemplateRecord> {
    const template = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });
    if (!template) throw new Error(`Email template with id ${id} not found`);
    return template;
  }

  async getByName(name: string): Promise<EmailTemplateRecord | null> {
    return this.prisma.emailTemplate.findUnique({
      where: { name },
    });
  }

  async create(data: {
    name: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
    variables?: Record<string, unknown>;
    isActive?: boolean;
  }): Promise<EmailTemplateRecord> {
    try {
      return await this.prisma.emailTemplate.create({
        data: {
          name: data.name,
          subject: data.subject,
          htmlBody: data.htmlBody,
          textBody: data.textBody ?? null,
          variables: data.variables ?? null,
          isActive: data.isActive ?? true,
        },
      });
    } catch (error) {
      throw new Error(`Email template with name "${data.name}" already exists`);
    }
  }

  async update(
    id: number,
    data: {
      name?: string;
      subject?: string;
      htmlBody?: string;
      textBody?: string;
      variables?: Record<string, unknown>;
      isActive?: boolean;
    },
  ): Promise<EmailTemplateRecord> {
    const existing = await this.prisma.emailTemplate.findUnique({
      where: { id },
    });
    if (!existing) throw new Error(`Email template with id ${id} not found`);
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.prisma.emailTemplate.findUnique({
        where: { name: data.name },
      });
      if (duplicate)
        throw new Error(
          `Email template with name "${data.name}" already exists`,
        );
    }
    try {
      return await this.prisma.emailTemplate.update({
        where: { id },
        data: {
          name: data.name,
          subject: data.subject,
          htmlBody: data.htmlBody,
          textBody: data.textBody,
          variables: data.variables,
          isActive: data.isActive,
        },
      });
    } catch {
      throw new Error(`Email template with id ${id} not found`);
    }
  }

  async delete(id: number): Promise<void> {
    try {
      await this.prisma.emailTemplate.delete({
        where: { id },
      });
    } catch {
      throw new Error(`Email template with id ${id} not found`);
    }
  }

  async renderTemplate(
    templateName: string,
    variables: Record<string, unknown>,
  ): Promise<{ subject: string; htmlBody: string; textBody: string }> {
    const dbTemplate = await this.prisma.emailTemplate.findFirst({
      where: {
        name: templateName,
        isActive: true,
      },
    });
    const subject = dbTemplate?.subject || this.defaultSubject(templateName);
    let htmlBody = '';
    try {
      htmlBody = this.renderHandlebars(
        templateName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        variables,
      );
    } catch {
      // fall back to DB
    }
    if (!htmlBody && dbTemplate) {
      htmlBody = this.replacePlaceholders(dbTemplate.htmlBody, variables);
    }
    if (!htmlBody)
      throw new Error(
        `Email template "${templateName}" not found or is inactive`,
      );
    const textBody = dbTemplate?.textBody
      ? this.replacePlaceholders(dbTemplate.textBody, variables)
      : sanitizeHtml(htmlBody) || '';
    return { subject, htmlBody, textBody };
  }

  private renderHandlebars(
    name: string,
    context: Record<string, unknown>,
  ): string {
    if (this.cache.has(name)) return this.cache.get(name)!(context);
    const filePath = path.join(this.templateDir, `${name}.hbs`);
    if (!fs.existsSync(filePath)) return '';
    const source = fs.readFileSync(filePath, 'utf-8');
    const compiled = Handlebars.compile(source, { noEscape: false });
    this.cache.set(name, compiled);
    return compiled(context);
  }

  private defaultSubject(templateName: string): string {
    return templateName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  private replacePlaceholders(
    content: string,
    variables: Record<string, unknown>,
  ): string {
    return content.replace(/\{\{(\w+)\}\}/g, (_match: string, key: string) => {
      const record = variables as Record<string, string | number | boolean>;
      const value = record[key];
      if (value === undefined) return _match;
      return String(value);
    });
  }
}
