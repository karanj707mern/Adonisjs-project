import AdminController from './admin_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerAdmin(router: Router) {
  router.get('overview', [AdminController, 'getOverview'])

  router
    .group(() => {
      router.get('users', [AdminController, 'listUsers'])
      router.get('users/:id', [AdminController, 'getUser'])
      router.patch('users/:id', [AdminController, 'updateUser'])
      router.delete('users/:id', [AdminController, 'deleteUser'])
      router.get('orders', [AdminController, 'listOrders'])
      router.get('products/pending', [AdminController, 'listPendingProducts'])
      router.patch('products/:id/approve', [AdminController, 'approveProduct'])
      router.patch('products/:id/reject', [AdminController, 'rejectProduct'])
      router.get('reviews/pending', [AdminController, 'listPendingReviews'])
      router.patch('reviews/:id/approve', [AdminController, 'approveReview'])
      router.patch('reviews/:id/reject', [AdminController, 'rejectReview'])
      router.get('blog/pending', [AdminController, 'listPendingBlogPosts'])
      router.patch('blog/:id/publish', [AdminController, 'publishBlogPost'])
      router.patch('blog/:id/unpublish', [AdminController, 'unpublishBlogPost'])
    })
    .prefix('admin')
    .middleware(middleware.auth())
    .middleware(middleware.admin())
}
