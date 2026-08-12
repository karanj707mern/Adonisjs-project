import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useBlogPost = routeLoader$(async ({ params, status }) => {
  try {
    const response = await api.blog.getBySlug(params.slug)
    return response.data
  } catch {
    status(404)
    return null
  }
})

export default component$(() => {
  const post = useBlogPost()
  const loading = useSignal(true)

  useVisibleTask$(() => {
    loading.value = false
  })

  if (!post) {
    return (
      <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-4">
            Blog Post Not Found
          </h1>
          <a href="/blog" class="btn btn-primary">
            Back to Blog
          </a>
        </div>
      </div>
    )
  }

  return (
    <div>
      <MainNavbar />
      
      <div class="min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-4xl">
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              class="w-full h-64 md:h-96 object-cover rounded-2xl mb-8"
            />
          )}
          
          <h1 class="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4">
            {post.title}
          </h1>

          <div class="flex items-center gap-4 text-sm text-stone-600 dark:text-stone-400 mb-8">
            <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
          </div>

          <div
            class="prose prose-lg dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={post.content}
          />
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = ({ resolveValue }) => {
  const post = resolveValue(useBlogPost)
  
  if (!post) {
    return {
      title: 'Blog Post Not Found - Moringa Store',
    }
  }

  return {
    title: `${post.title} - Moringa Store`,
    meta: [
      {
        name: 'description',
        content: post.excerpt,
      },
    ],
  }
}
