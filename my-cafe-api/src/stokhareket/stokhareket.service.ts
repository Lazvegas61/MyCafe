import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StokHareket } from './stokhareket.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class StokHareketService {
  constructor(
    @InjectRepository(StokHareket) private hareketRepo: Repository<StokHareket>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}

  async stokGiris(productId: number, miktar: number) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    product.stock += miktar;
    await this.productRepo.save(product);

    const hareket = this.hareketRepo.create({
      product,
      miktar,
      tur: 'GIRIS',
    });

    return this.hareketRepo.save(hareket);
  }

  async stokCikis(productId: number, miktar: number) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    product.stock -= miktar;
    if (product.stock < 0) product.stock = 0;
    await this.productRepo.save(product);

    const hareket = this.hareketRepo.create({
      product,
      miktar,
      tur: 'CIKIS',
    });

    return this.hareketRepo.save(hareket);
  }

  async satis(productId: number, miktar: number) {
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    product.stock -= miktar;
    if (product.stock < 0) product.stock = 0;
    await this.productRepo.save(product);

    const hareket = this.hareketRepo.create({
      product,
      miktar,
      tur: 'SATIS',
    });

    return this.hareketRepo.save(hareket);
  }

  async getAll() {
    return this.hareketRepo.find({ order: { id: 'DESC' } });
  }
}

