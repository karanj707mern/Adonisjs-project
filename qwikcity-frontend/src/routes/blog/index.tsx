import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { getBlogPosts } from "~/lib/api/blog";
import { resolveImageUrl } from "~/lib/config";
import { formatMediumDate } from "~/lib/formatters";

interface BlogPost {
  id: string | number;
  slug?: string;
  title: string;
  excerpt?: string;
  content?: string;
  image?: string;
  publishedAt?: string;
  createdAt?: string;
}

function normalize(data: unknown): BlogPost[] {
  if (Array.isArray(data)) return data as BlogPost[];
  if (
    data &&
    typeof data === "object" &&
    Array.isArray((data as { posts?: unknown }).posts)
  ) {
    return (data as { posts: BlogPost[] }).posts;
  }
  return [];
}

export const useBlogPosts = routeLoader$(async () => {
  try {
    const data = await getBlogPosts();
    return { posts: normalize(data), error: "" };
  } catch (err) {
    return {
      posts: [],
      error: err instanceof Error ? err.message : "Could not load posts.",
    };
  }
});

export default component$(() => {
  const data = useBlogPosts();

  return (
    <div class="container-page py-10">
      <h1 class="text-3xl font-bold">Wellness Blog</h1>
      <p class="mt-2 text-slate-500">
        Tips, recipes and stories about living well with moringa.
      </p>

      {data.value.error ? (
        <p class="mt-6 rounded-lg border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
          {data.value.error}
        </p>
      ) : data.value.posts.length === 0 ? (
        <p class="mt-6 text-sm text-slate-500">No posts yet.</p>
      ) : (
        <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.value.posts.map((post) => (
            <a
              key={post.id}
              href={`/blog/${post.slug ?? post.id}`}
              class="card group overflow-hidden"
            >
              <div class="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                {post.image ? (
                  <img
                    src={resolveImageUrl(post.image)}
                    alt={post.title}
                    loading="lazy"
                    class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : null}
              </div>
              <div class="p-4">
                <h2 class="font-semibold leading-tight group-hover:text-neon">
                  {post.title}
                </h2>
                {post.excerpt ? (
                  <p class="mt-2 line-clamp-3 text-sm text-slate-500 dark:text-slate-400">
                    {post.excerpt}
                  </p>
                ) : null}
                {post.publishedAt || post.createdAt ? (
                  <p class="mt-3 text-xs text-slate-400">
                    {formatMediumDate(post.publishedAt ?? post.createdAt)}
                  </p>
                ) : null}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
});
