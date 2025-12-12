/* -------------------------------------------------------
   PRODUCT SERVICE (FINAL)
------------------------------------------------------- */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../categories/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,

    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  async create(data: any) {
    const category = await this.categoryRepo.findOne({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Kategori bulunamadı');
    }

    const product = this.productRepo.create({
      name: data.name,
      stock: data.stock ?? 0,
      critical: data.critical ?? 0,
      cost: data.cost ?? 0,
      price: data.price ?? 0,
      category,
    });

    return this.productRepo.save(product);
  }

  findAll() {
    return this.productRepo.find({
      order: { name: 'ASC' },
    });
  }

  async update(id: number, data: any) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    if (data.categoryId) {
      const category = await this.categoryRepo.findOne({
        where: { id: data.categoryId },
      });
      if (!category) throw new NotFoundException('Kategori bulunamadı');
      product.category = category;
    }

    Object.assign(product, data);
    return this.productRepo.save(product);
  }

  async remove(id: number) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Ürün bulunamadı');

    return this.productRepo.remove(product);
  }
}
