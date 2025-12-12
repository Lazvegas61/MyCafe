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
exports.StokController = void 0;
const common_1 = require("@nestjs/common");
const stok_service_1 = require("./stok.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const user_entity_1 = require("../users/user.entity");
let StokController = class StokController {
    constructor(stokService) {
        this.stokService = stokService;
    }
    hareketEkle(productId, miktar, islemTipi, aciklama) {
        return this.stokService.hareketEkle(productId, miktar, islemTipi, aciklama);
    }
    liste() {
        return this.stokService.liste();
    }
};
exports.StokController = StokController;
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN, user_entity_1.UserRole.SUPERADMIN),
    (0, common_1.Post)('hareket'),
    __param(0, (0, common_1.Body)('productId')),
    __param(1, (0, common_1.Body)('miktar')),
    __param(2, (0, common_1.Body)('islemTipi')),
    __param(3, (0, common_1.Body)('aciklama')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", void 0)
], StokController.prototype, "hareketEkle", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('liste'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StokController.prototype, "liste", null);
exports.StokController = StokController = __decorate([
    (0, common_1.Controller)('stok'),
    __metadata("design:paramtypes", [stok_service_1.StokService])
], StokController);
//# sourceMappingURL=stok.controller.js.map