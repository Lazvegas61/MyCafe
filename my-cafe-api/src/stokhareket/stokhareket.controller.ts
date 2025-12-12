import { Controller, Post, Body, Get } from '@nestjs/common';
import { StokHareketService } from './stokhareket.service';

@Controller('stok')
export class StokHareketController {
  constructor(private readonly service: StokHareketService) {}

  @Post('giris')
  stokGiris(@Body() body: { productId: number; miktar: number }) {
    return this.service.stokGiris(body.productId, body.miktar);
  }

  @Post('cikis')
  stokCikis(@Body() body: { productId: number; miktar: number }) {
    return this.service.stokCikis(body.productId, body.miktar);
  }

  @Post('satis')
  satis(@Body() body: { productId: number; miktar: number }) {
    return this.service.satis(body.productId, body.miktar);
  }

  @Get('liste')
  getAll() {
    return this.service.getAll();
  }
}

