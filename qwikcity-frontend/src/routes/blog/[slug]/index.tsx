import { component$ } from "@builder.io/qwik";
import { routeLoader$ } from "@builder.io/qwik-city";
import { getBlogPost } from "~/lib/api/blog";
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

export const useBlogPost = routeLoader$(async ({ params }) => {
  try {
    const data = await getBlogPost(params.slug);
    const post: BlogPost = Array.isArray(data) ? (data[0] as BlogPost) : (data as BlogPost);
    return { post, error: "" };
  } catch (err) {
    return { post: null, error: err instanceof Error ? err.message : "Post not found." };
  }
});

export default component$(() => {
  const data = useBlogPost();

  if (data.value.error || !data.value.post) {
    return (
      <div class="container-page py-20 text-center">
        <h1 class="text-2xl font-bold">Post not found</h1>
        <a href="/blog" class="btn-primary mt-6">Back to blog</a>
      </div>
    );
  }

  const post = data.value.post;

  return (
    <article class="container-page max-w-3xl py-10">
      <a href="/blog" class="text-sm text-neon hover:underline">← All posts</a>
      <h1 class="mt-4 text-3xl font-bold">{post.title}</h1>
      {post.publishedAt || post.createdAt ? (
        <p class="mt-2 text-sm text-slate-400">{formatMediumDate(post.publishedAt ?? post.createdAt)}</p>
      ) : null}
      {post.image ? (
        <img src={resolveImageUrl(post.image)} alt={post.title} class="mt-6 aspect-video w-full rounded-xl object-cover" />
      ) : null}
      {post.content ? (
        <div
          class="prose mt-6 max-w-none dark:prose-invert"
          dangerouslySetInnerHTML={post.content}
        />
      ) : post.excerpt ? (
        <p class="mt-6 text-slate-600 dark:text-slate-300">{post.excerpt}</p>
      ) : null}
    </article>
  );
});
