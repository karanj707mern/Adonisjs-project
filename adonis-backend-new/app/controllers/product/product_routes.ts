import ProductController from './product_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerProduct(router: Router) {
  router
    .group(() => {
      router
        .post('upload-image', [ProductController, 'uploadImage'])
        .middleware(middleware.auth())
        .middleware(middleware.admin())

      router.post('', [ProductController, 'createProduct']).middleware(middleware.auth()).middleware(middleware.admin())

      router.get('', [ProductController, 'getProducts'])

      router
        .get('admin/all', [ProductController, 'getAdminProducts'])
        .middleware(middleware.auth())
        .middleware(middleware.admin())

      router.get('new-arrivals', [ProductController, 'getNewArrivals'])

      router.get(':id', [ProductController, 'getProduct'])

      router
        .patch(':id', [ProductController, 'updateProduct'])
        .middleware(middleware.auth())
        .middleware(middleware.admin())

      router
        .delete(':id', [ProductController, 'deleteProduct'])
        .middleware(middleware.auth())
        .middleware(middleware.admin())

      router.post('viewed', [ProductController, 'recordView']).middleware(middleware.auth())
      router.get('viewed', [ProductController, 'getRecentlyViewed']).middleware(middleware.auth())
      router.delete('viewed', [ProductController, 'clearHistory']).middleware(middleware.auth())
    })
    .prefix('products')
}
