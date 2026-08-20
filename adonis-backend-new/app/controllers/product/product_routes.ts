import type { Router } from '@adonisjs/core/http';
import ProductController from './product_controller';

export default function registerProduct(router) {
  router
    .group(() => {
      router
        .post('upload-image', [ProductController, 'uploadImage'])
        .middleware('auth')
        .middleware('admin');

      router
        .post('', [ProductController, 'createProduct'])
        .middleware('auth')
        .middleware('admin');

      router.get('', [ProductController, 'getProducts']);

      router
        .get('admin/all', [ProductController, 'getAdminProducts'])
        .middleware('auth')
        .middleware('admin');

      router.get('new-arrivals', [ProductController, 'getNewArrivals']);

      router.get(':id', [ProductController, 'getProduct']);

      router
        .patch(':id', [ProductController, 'updateProduct'])
        .middleware('auth')
        .middleware('admin');

      router
        .delete(':id', [ProductController, 'deleteProduct'])
        .middleware('auth')
        .middleware('admin');

      router
        .post('viewed', [ProductController, 'recordView'])
        .middleware('auth');
      router
        .get('viewed', [ProductController, 'getRecentlyViewed'])
        .middleware('auth');
      router
        .delete('viewed', [ProductController, 'clearHistory'])
        .middleware('auth');
    })
    .prefix('Product');
}
