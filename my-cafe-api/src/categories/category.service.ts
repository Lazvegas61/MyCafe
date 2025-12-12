import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) {}

  async create(name: string, parentId?: number) {
    let parent: Category | null = null;

    if (parentId) {
      parent = await this.repo.findOne({ where: { id: parentId } });
      if (!parent) throw new NotFoundException('Parent kategori bulunamadı');
    }

    const newCategory = this.repo.create({
      name,
      parent: parent ?? null,
    });

    return this.repo.save(newCategory);
  }

  async findAll() {
    return this.repo.find({ relations: ['parent', 'children'] });
  }

  async findOne(id: number) {
    const category = await this.repo.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) throw new NotFoundException('Kategori bulunamadı');
    return category;
  }

  async remove(id: number) {
    const category = await this.findOne(id);
    return this.repo.remove(category);
  }
}
