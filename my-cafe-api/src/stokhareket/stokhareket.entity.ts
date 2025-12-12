import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Product } from '../products/product.entity';

@Entity()
export class StokHareket {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @Column('int')
  miktar: number;

  @Column()
  tur: 'GIRIS' | 'CIKIS' | 'SATIS';

  @CreateDateColumn()
  createdAt: Date;
}

