"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StokHareketModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const stokhareket_entity_1 = require("./stokhareket.entity");
const stokhareket_service_1 = require("./stokhareket.service");
const stokhareket_controller_1 = require("./stokhareket.controller");
const product_entity_1 = require("../products/product.entity");
let StokHareketModule = class StokHareketModule {
};
exports.StokHareketModule = StokHareketModule;
exports.StokHareketModule = StokHareketModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([stokhareket_entity_1.StokHareket, product_entity_1.Product])],
        controllers: [stokhareket_controller_1.StokHareketController],
        providers: [stokhareket_service_1.StokHareketService],
    })
], StokHareketModule);
//# sourceMappingURL=stokhareket.module.js.map