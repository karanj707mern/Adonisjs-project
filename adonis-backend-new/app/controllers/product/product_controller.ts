import type { HttpContext } from '@adonisjs/core/http';
import { inject } from '@adonisjs/fold';
import {
  createProductValidator,
  updateProductValidator,
} from './product_validators';
import ProductService from './product_service';
import CatalogExtraService from './catalog_extra_service';
import {  BadRequestException  } from '#exceptions/http_exceptions';

@inject()
export default class ProductController {
  constructor(
    private productService: ProductService,
    private catalogExtra: CatalogExtraService,
  ) {}

  async uploadImage({ request, response }: HttpContext) {
    const file = request.file('image', {
      size: '50mb',
      extnames: ['jpg', 'png', 'webp', 'avif', 'gif'],
    });
    if (!file) {
      throw new BadRequestException('An image file is required.');
    }

    const buffer = await file.toBuffer();
    const result = await this.productService.uploadProductImage({
      buffer,
      mimetype: file.type,
      originalname: file.clientName,
    });
    return response.status(201).json(result);
  }

  async createProduct({ request, response }: HttpContext) {
    const data = await request.validateUsing(createProductValidator);
    const result = await this.productService.createProduct(data);
    return response.status(201).json(result);
  }

  async getProducts({ request, response }: HttpContext) {
    const skip = Number(request.input('skip') || 0);
    const take = Math.min(Number(request.input('take') || 50), 50);
    const result = await this.productService.getProducts(false, skip, take);
    return response.json(result);
  }

  async getAdminProducts({ request, response }: HttpContext) {
    const skip = Number(request.input('skip') || 0);
    const take = Math.min(Number(request.input('take') || 50), 50);
    const result = await this.productService.getProducts(true, skip, take);
    return response.json(result);
  }

  async getNewArrivals({ response }: HttpContext) {
    const result = await this.productService.getNewArrivals();
    return response.json(result);
  }

  async getProduct({ params, response }: HttpContext) {
    const id = Number(params.id);
    const result = await this.productService.getProductById(id);
    return response.json(result);
  }

  async updateProduct({ params, request, response }: HttpContext) {
    const id = Number(params.id);
    const data = await request.validateUsing(updateProductValidator);
    const result = await this.productService.updateProduct(id, data);
    return response.json(result);
  }

  async deleteProduct({ params, response }: HttpContext) {
    const id = Number(params.id);
    await this.productService.deleteProduct(id);
    return response.status(204).send('');
  }

  async recordView({ auth, request }: HttpContext) {
    const productId = Number(request.input('productId'));
    return this.catalogExtra.addView(auth.user!.id, productId);
  }

  async getRecentlyViewed({ auth, response }: HttpContext) {
    const result = await this.catalogExtra.getRecentlyViewed(auth.user!.id);
    return response.json(result);
  }

  async clearHistory({ auth, response }: HttpContext) {
    await this.catalogExtra.clearHistory(auth.user!.id);
    return response.status(204).send('');
  }
}
