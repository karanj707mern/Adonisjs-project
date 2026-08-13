import type { Router } from '@adonisjs/core/http'
import BlogController from './blog_controller'

export default function registerBlog(router: Router) {
  router.post('blog/upload-image', [BlogController, 'uploadImage'])
    .middleware('auth')
    .middleware('admin')

  router.post('blog', [BlogController, 'createPost'])
    .middleware('auth')
    .middleware('admin')

  router.get('blog', [BlogController, 'getPublishedPosts'])

  router.get('blog/admin/all', [BlogController, 'getAllPosts'])
    .middleware('auth')
    .middleware('admin')

  router.get('blog/:slug', [BlogController, 'getPostBySlug'])

  router.patch('blog/:id', [BlogController, 'updatePost'])
    .middleware('auth')
    .middleware('admin')

  router.delete('blog/:id', [BlogController, 'deletePost'])
    .middleware('auth')
    .middleware('admin')
}
