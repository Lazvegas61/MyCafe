import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async create(username: string, password: string, role: UserRole) {
    const hashed = await bcrypt.hash(password, 10);

    const user = this.usersRepo.create({
      username,
      password: hashed,
      role,
    });

    return this.usersRepo.save(user);
  }

  async findByUsername(username: string) {
    return this.usersRepo.findOne({ where: { username } });
  }

  async findAll() {
    return this.usersRepo.find();
  }

  // 🔥 İlk veri oluşturma
  async seedInitialUsers() {
    const count = await this.usersRepo.count();
    if (count > 0) return;

    // ❗❗ HATALI ❌
    // await this.create('superadmin', '1234', 'SUPERADMIN');

    // ✔ DOĞRU KULLANIM ✔
    await this.create('superadmin', '1234', UserRole.SUPERADMIN);
    await this.create('admin', '1234', UserRole.ADMIN);

    console.log('Default kullanıcılar oluşturuldu.');
  }
}
