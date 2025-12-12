import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';

import { StokService } from './stok.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('stok')
export class StokController {
  constructor(private readonly stokService: StokService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Post('hareket')
  hareketEkle(
    @Body('productId') productId: number,
    @Body('miktar') miktar: number,
    @Body('islemTipi') islemTipi: 'GIRIS' | 'CIKIS' | 'SATIS',
    @Body('aciklama') aciklama?: string,
  ) {
    return this.stokService.hareketEkle(
      productId,
      miktar,
      islemTipi,
      aciklama,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('liste')
  liste() {
    return this.stokService.liste();
  }
}
