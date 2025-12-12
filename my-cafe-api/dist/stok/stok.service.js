"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StokService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const stok_entity_1 = require("./stok.entity");
const product_entity_1 = require("../products/product.entity");
let StokService = class StokService {
    constructor(stokRepo, productRepo) {
        this.stokRepo = stokRepo;
        this.productRepo = productRepo;
    }
    async hareketEkle(productId, miktar, islemTipi, aciklama) {
        const product = await this.productRepo.findOne({
            where: { id: productId },
        });
        if (!product)
            throw new common_1.NotFoundException('Ürün bulunamadı');
        // Stok güncelle
        if (islemTipi === 'GIRIS')
            product.stock += miktar;
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
};
exports.StokService = StokService;
exports.StokService = StokService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(stok_entity_1.StokHareket)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], StokService);
//# sourceMappingURL=stok.service.js.map