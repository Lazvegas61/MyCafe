import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  GARSON = 'GARSON',
  MUTFAK = 'MUTFAK',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.GARSON,
  })
  role: UserRole;
}
