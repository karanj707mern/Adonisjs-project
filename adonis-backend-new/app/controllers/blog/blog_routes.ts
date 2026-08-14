import BlogController from './blog_controller.ts'
import { middleware } from '#start/kernel'
import type { Router } from '@adonisjs/core/http'

export default function registerBlog(router: Router) {
  router
    .post('blog/upload-image', [BlogController, 'uploadImage'])
    .middleware(middleware.auth())
    .middleware(middleware.admin())

  router.post('blog', [BlogController, 'createPost']).middleware(middleware.auth()).middleware(middleware.admin())

  router.get('blog', [BlogController, 'getPublishedPosts'])

  router
    .get('blog/admin/all', [BlogController, 'getAllPosts'])
    .middleware(middleware.auth())
    .middleware(middleware.admin())

  router.get('blog/:slug', [BlogController, 'getPostBySlug'])

  router.patch('blog/:id', [BlogController, 'updatePost']).middleware(middleware.auth()).middleware(middleware.admin())

  router.delete('blog/:id', [BlogController, 'deletePost']).middleware(middleware.auth()).middleware(middleware.admin())
}
