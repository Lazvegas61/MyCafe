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
exports.StokHareketController = void 0;
const common_1 = require("@nestjs/common");
const stokhareket_service_1 = require("./stokhareket.service");
let StokHareketController = class StokHareketController {
    constructor(service) {
        this.service = service;
    }
    stokGiris(body) {
        return this.service.stokGiris(body.productId, body.miktar);
    }
    stokCikis(body) {
        return this.service.stokCikis(body.productId, body.miktar);
    }
    satis(body) {
        return this.service.satis(body.productId, body.miktar);
    }
    getAll() {
        return this.service.getAll();
    }
};
exports.StokHareketController = StokHareketController;
__decorate([
    (0, common_1.Post)('giris'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StokHareketController.prototype, "stokGiris", null);
__decorate([
    (0, common_1.Post)('cikis'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StokHareketController.prototype, "stokCikis", null);
__decorate([
    (0, common_1.Post)('satis'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StokHareketController.prototype, "satis", null);
__decorate([
    (0, common_1.Get)('liste'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StokHareketController.prototype, "getAll", null);
exports.StokHareketController = StokHareketController = __decorate([
    (0, common_1.Controller)('stok'),
    __metadata("design:paramtypes", [stokhareket_service_1.StokHareketService])
], StokHareketController);
//# sourceMappingURL=stokhareket.controller.js.map