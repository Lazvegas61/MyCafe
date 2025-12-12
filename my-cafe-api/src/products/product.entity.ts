import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('int', { default: 0 })
  stock: number;

  @Column('int', { default: 0 })
  critical: number;

  @Column('int', { default: 0 })
  cost: number;

  @Column('int', { default: 0 })
  price: number;

  @ManyToOne(() => Category, { eager: true, nullable: false })
  category: Category;
}
