/* -------------------------------------------------------
   PRODUCT CONTROLLER (FINAL)
------------------------------------------------------- */
import { Controller, Post, Get, Patch, Delete, Body, Param } from '@nestjs/common';
import { ProductService } from './product.service';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post('create')
  create(@Body() body: any) {
    return this.productService.create(body);
  }

  @Get()
  findAll() {
    return this.productService.findAll();
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.productService.update(Number(id), body);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.productService.remove(Number(id));
  }
}
