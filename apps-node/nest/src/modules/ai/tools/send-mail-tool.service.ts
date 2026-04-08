import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { tool } from '@langchain/core/tools';
import z from 'zod';
import { SEND_MAIL_TOOL_NAME } from './tool-names';
import { BaseToolService } from './base-tool.service';

@Injectable()
export class SendMailToolService extends BaseToolService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  create() {
    const schema = z.object({
      to: z.email().describe('收件人邮箱地址，例如：someone@example.com'),
      subject: z.string().describe('邮件主题'),
      text: z.string().optional().describe('纯文本内容，可选'),
      html: z.string().optional().describe('HTML 内容，可选'),
    });

    return tool<typeof schema, string>(
      async ({ to, subject, text, html }) => {
        const fallbackFrom = this.configService.get<string>('MAIL_FROM');
        try {
          await this.mailerService.sendMail({
            to,
            subject,
            text: text ?? '（无文本内容）',
            html: html ?? `<p>${text ?? '（无 HTML 内容）'}</p>`,
            from: fallbackFrom,
          });
          return `邮件已发送到 ${to}，主题为「${subject}」`;
        } catch (error) {
          return `发送邮件失败：${error instanceof Error ? error.message : String(error)}`;
        }
      },
      {
        name: SEND_MAIL_TOOL_NAME,
        description: '发送邮件的工具，根据提供的收件人、主题和内容发送邮件',
        schema,
      },
    );
  }
}
