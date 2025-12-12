/* -------------------------------------------------------
   MyCafe — APP MODULE (FINAL)
------------------------------------------------------- */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './categories/category.module';
import { ProductModule } from './products/product.module';
import { StokHareketModule } from './stokhareket/stokhareket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      synchronize: true,
      autoLoadEntities: true,
    }),

    // 🔥 BÜTÜN MODÜLLER BURAYA EKLENMELİ
    UsersModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    StokHareketModule,
  ],
})
export class AppModule {}
