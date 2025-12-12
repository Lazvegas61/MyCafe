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
exports.ProductService = void 0;
/* -------------------------------------------------------
   PRODUCT SERVICE (FINAL)
------------------------------------------------------- */
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./product.entity");
const category_entity_1 = require("../categories/category.entity");
let ProductService = class ProductService {
    constructor(productRepo, categoryRepo) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
    }
    async create(data) {
        var _a, _b, _c, _d;
        const category = await this.categoryRepo.findOne({
            where: { id: data.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Kategori bulunamadı');
        }
        const product = this.productRepo.create({
            name: data.name,
            stock: (_a = data.stock) !== null && _a !== void 0 ? _a : 0,
            critical: (_b = data.critical) !== null && _b !== void 0 ? _b : 0,
            cost: (_c = data.cost) !== null && _c !== void 0 ? _c : 0,
            price: (_d = data.price) !== null && _d !== void 0 ? _d : 0,
            category,
        });
        return this.productRepo.save(product);
    }
    findAll() {
        return this.productRepo.find({
            order: { name: 'ASC' },
        });
    }
    async update(id, data) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Ürün bulunamadı');
        if (data.categoryId) {
            const category = await this.categoryRepo.findOne({
                where: { id: data.categoryId },
            });
            if (!category)
                throw new common_1.NotFoundException('Kategori bulunamadı');
            product.category = category;
        }
        Object.assign(product, data);
        return this.productRepo.save(product);
    }
    async remove(id) {
        const product = await this.productRepo.findOne({ where: { id } });
        if (!product)
            throw new common_1.NotFoundException('Ürün bulunamadı');
        return this.productRepo.remove(product);
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductService);
//# sourceMappingURL=product.service.js.map