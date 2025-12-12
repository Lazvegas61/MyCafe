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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StokHareket = void 0;
const typeorm_1 = require("typeorm");
const product_entity_1 = require("../products/product.entity");
let StokHareket = class StokHareket {
};
exports.StokHareket = StokHareket;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StokHareket.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, { eager: true }),
    __metadata("design:type", product_entity_1.Product)
], StokHareket.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.Column)('int'),
    __metadata("design:type", Number)
], StokHareket.prototype, "miktar", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], StokHareket.prototype, "tur", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StokHareket.prototype, "createdAt", void 0);
exports.StokHareket = StokHareket = __decorate([
    (0, typeorm_1.Entity)()
], StokHareket);
//# sourceMappingURL=stokhareket.entity.js.map