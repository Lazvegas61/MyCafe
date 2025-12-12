import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StokHareket } from './stok.entity';
import { Product } from '../products/product.entity';
import { StokService } from './stok.service';
import { StokController } from './stok.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StokHareket, Product])],
  controllers: [StokController],
  providers: [StokService],
  exports: [StokService],
})
export class StokModule {}
