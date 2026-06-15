import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle('Cocktails API')
    .setDescription('REST API for browsing, searching and creating cocktails.')
    .setVersion('1.0')
    .addTag('cocktails')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'docs-json',
  });

  await app.listen(3000);
  console.log('Backend listening on port 3000');
  console.log('OpenAPI docs available at http://localhost:3000/docs');
}
bootstrap();
