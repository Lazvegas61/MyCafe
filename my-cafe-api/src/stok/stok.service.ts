import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StokHareket } from './stok.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class StokService {
  constructor(
    @InjectRepository(StokHareket)
    private stokRepo: Repository<StokHareket>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async hareketEkle(
    productId: number,
    miktar: number,
    islemTipi: 'GIRIS' | 'CIKIS' | 'SATIS',
    aciklama?: string,
  ) {
    const product = await this.productRepo.findOne({
      where: { id: productId },
    });

    if (!product) throw new NotFoundException('Ürün bulunamadı');

    // Stok güncelle
    if (islemTipi === 'GIRIS') product.stock += miktar;
    if (islemTipi === 'CIKIS' || islemTipi === 'SATIS')
      product.stock -= miktar;

    await this.productRepo.save(product);

    const hareket = this.stokRepo.create({
      product,
      miktar,
      islemTipi,
      aciklama,
    });

    return this.stokRepo.save(hareket);
  }

  async liste() {
    return this.stokRepo.find({
      order: { tarih: 'DESC' },
    });
  }
}
