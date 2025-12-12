import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from '../products/product.entity';

export type StokIslemTipi = 'GIRIS' | 'CIKIS' | 'SATIS';

@Entity()
export class StokHareket {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product, { eager: true })
  product: Product;

  @Column({ type: 'int' })
  miktar: number;

  @Column({ type: 'varchar' })
  islemTipi: StokIslemTipi;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  tarih: Date;

  @Column({ type: 'varchar', nullable: true })
  aciklama: string;
}
