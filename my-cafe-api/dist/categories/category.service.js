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
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("./category.entity");
let CategoryService = class CategoryService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(name, parentId) {
        let parent = null;
        if (parentId) {
            parent = await this.repo.findOne({ where: { id: parentId } });
            if (!parent)
                throw new common_1.NotFoundException('Parent kategori bulunamadı');
        }
        const newCategory = this.repo.create({
            name,
            parent: parent !== null && parent !== void 0 ? parent : null,
        });
        return this.repo.save(newCategory);
    }
    async findAll() {
        return this.repo.find({ relations: ['parent', 'children'] });
    }
    async findOne(id) {
        const category = await this.repo.findOne({
            where: { id },
            relations: ['parent', 'children'],
        });
        if (!category)
            throw new common_1.NotFoundException('Kategori bulunamadı');
        return category;
    }
    async remove(id) {
        const category = await this.findOne(id);
        return this.repo.remove(category);
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], CategoryService);
//# sourceMappingURL=category.service.js.map