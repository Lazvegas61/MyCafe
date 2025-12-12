import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StokHareket } from './stokhareket.entity';
import { StokHareketService } from './stokhareket.service';
import { StokHareketController } from './stokhareket.controller';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StokHareket, Product])],
  controllers: [StokHareketController],
  providers: [StokHareketService],
})
export class StokHareketModule {}

