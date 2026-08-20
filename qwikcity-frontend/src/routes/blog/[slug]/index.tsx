import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { useLocation, useNavigate } from "@builder.io/qwik-city";
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

export const useBlogPost = routeLoader$(async ({ params }) => {
  try {
    const data = await getBlogPosts();
    const all = normalize(data);
    const post =
      all.find((p) => p.slug === params.slug) ??
      (all[0] as BlogPost | undefined);
    return { post: post ?? null, error: "" };
  } catch (err) {
    return {
      post: null,
      error: err instanceof Error ? err.message : "Post not found.",
    };
  }
});

export default component$(() => {
  const data = useBlogPost();
  const loc = useLocation();
  const nav = useNavigate();
  const errorState = useSignal<string>("");
  const related = useStore<BlogPost[]>([]);

  useVisibleTask$(async () => {
    if (data.value.error) {
      errorState.value = data.value.error;
      return;
    }
    if (!data.value.post) {
      errorState.value = "Post not found.";
      return;
    }

    try {
      const raw = await getBlogPosts();
      const all = normalize(raw).filter(
        (p) => p.slug && p.slug !== (data.value.post as BlogPost)?.slug,
      );
      related.length = 0;
      all.slice(0, 3).forEach((p) => related.push(p));
    } catch {
      // related posts are optional
    }
  });

  if (errorState.value || !data.value.post) {
    return (
      <div class="container-page py-20 text-center">
        <h1 class="text-2xl font-bold">Post not found</h1>
        <p class="mt-2 text-slate-500">
          {errorState.value || "The post you're looking for doesn't exist."}
        </p>
        <a href="/blog" class="btn-primary mt-6">
          Back to blog
        </a>
      </div>
    );
  }

  const post = data.value.post as BlogPost;
  const dateLabel =
    post.publishedAt || post.createdAt
      ? formatMediumDate(post.publishedAt ?? post.createdAt)
      : "";

  return (
    <article class="container-page max-w-3xl py-10">
      <a
        href="/blog"
        class="text-sm text-neon hover:underline"
        onClick$={(e) => {
          e.preventDefault();
          nav("/blog");
        }}
      >
        ← All posts
      </a>

      <header class="mt-6">
        <h1 class="text-3xl font-bold leading-tight">{post.title}</h1>
        {dateLabel && <p class="mt-2 text-sm text-slate-400">{dateLabel}</p>}
        {post.excerpt && (
          <p class="mt-4 text-lg text-slate-600 dark:text-slate-300">
            {post.excerpt}
          </p>
        )}
      </header>

      {post.image && (
        <img
          src={resolveImageUrl(post.image)}
          alt={post.title}
          class="mt-6 aspect-video w-full rounded-xl object-cover"
        />
      )}

      {post.content ? (
        <div
          class="prose mt-8 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={post.content}
        />
      ) : post.excerpt ? (
        <p class="mt-6 text-slate-600 dark:text-slate-300">{post.excerpt}</p>
      ) : null}

      {/* Related posts */}
      {related.length > 0 && (
        <div class="mt-12">
          <h2 class="text-xl font-bold">More from the blog</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <a
                key={r.id}
                href={`/blog/${r.slug ?? r.id}`}
                class="card group overflow-hidden"
              >
                <div class="aspect-video overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {r.image ? (
                    <img
                      src={resolveImageUrl(r.image)}
                      alt={r.title}
                      loading="lazy"
                      class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : null}
                </div>
                <div class="p-4">
                  <h3 class="font-semibold leading-tight group-hover:text-neon">
                    {r.title}
                  </h3>
                  {r.excerpt && (
                    <p class="mt-2 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                      {r.excerpt}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </article>
  );
});
