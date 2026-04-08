import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatOpenAI } from '@langchain/openai';

@Global()
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        const port = Number(configService.get<string>('MAIL_PORT') ?? '465');
        const secure =
          (configService.get<string>('MAIL_SECURE') ?? 'true')
            .trim()
            .toLowerCase() === 'true';

        return {
          transport: {
            host: configService.get<string>('MAIL_HOST'),
            port,
            secure,
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 15000,
            auth: {
              user: configService.get<string>('MAIL_USER'),
              pass: configService.get<string>('MAIL_PASS'),
            },
          },
          defaults: {
            from: configService.get<string>('MAIL_FROM'),
          },
        };
      },
    }),
    PrismaModule,
  ],
  providers: [
    {
      provide: 'CHAT_MODEL',
      useFactory: (configService: ConfigService) => {
        return new ChatOpenAI({
          model: configService.get<string>('OPENAI_MODEL'),
          temperature: 0.9,
          apiKey: configService.get<string>('OPENAI_API_KEY'),
          configuration: {
            baseURL: configService.get<string>('OPENAI_BASE_URL'),
          },
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [ConfigModule, PrismaModule, 'CHAT_MODEL'],
})
export class GlobalModule {}
