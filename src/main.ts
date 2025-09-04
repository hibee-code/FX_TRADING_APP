import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  let app;
  if (process.env.HTTPS_KEY && process.env.HTTPS_CERT) {
    const fs = require('fs');
    app = await NestFactory.create(AppModule, {
      httpsOptions: {
        key: fs.readFileSync(process.env.HTTPS_KEY),
        cert: fs.readFileSync(process.env.HTTPS_CERT),
      },
    });
  } else {
    app = await NestFactory.create(AppModule);
  }

   // Set global prefix for all routes
   app.setGlobalPrefix('api');
  
   // Enable validation
   app.useGlobalPipes(new ValidationPipe({
     whitelist: true,
     transform: true,
     forbidNonWhitelisted: true,
   }));
   
   // CORS setup
  app.enableCors();

  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
