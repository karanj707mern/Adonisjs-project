import { component$, useSignal, useVisibleTask$ } from '@builder.io/qwik'
import { routeLoader$, type DocumentHead } from '@builder.io/qwik-city'
import { api } from '~lib/api-client'
import { MainNavbar } from '~components/MainNavbar'
import { Footer } from '~components/Footer'

export const useBlogPosts = routeLoader$(async () => {
  try {
    const response = await api.blog.getAll()
    return response.data
  } catch {
    return []
  }
})

export default component$(() => {
  const posts = useBlogPosts()
  const loading = useSignal(true)

  useVisibleTask$(async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    loading.value = false
  })

  return (
    <div>
      <MainNavbar />
      
      <div class="min-h-screen">
        <div class="container mx-auto px-4 py-8">
          <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-8">
            Wellness Journal
          </h1>

          {loading.value ? (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} class="skeleton h-96 rounded-xl" />
              ))}
            </div>
          ) : (
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.value.map((post: any) => (
                <article key={post.id} class="card overflow-hidden hover:shadow-xl transition-shadow">
                  {post.coverImage && (
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      class="w-full h-48 object-cover"
                    />
                  )}
                  <div class="p-6">
                    <h2 class="text-xl font-bold text-stone-800 dark:text-stone-100 mb-2">
                      {post.title}
                    </h2>
                    <p class="text-stone-600 dark:text-stone-300 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <a
                      href={`/blog/${post.slug}`}
                      class="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Read More →
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
})

export const head: DocumentHead = {
  title: 'Wellness Journal - Moringa Store',
  meta: [
    {
      name: 'description',
      content: 'Read articles about natural wellness, health tips, and Moringa product guides.',
    },
  ],
}
