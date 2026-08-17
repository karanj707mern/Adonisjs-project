import { component$, useStore, useVisibleTask$, $ } from "@builder.io/qwik";
import { getBlogPosts, createBlogPost, deleteBlogPost } from "~/lib/api/blog";
import { toast } from "~/lib/toast";

interface BlogPost {
  id: string | number;
  title: string;
  slug?: string;
}

export default component$(() => {
  const state = useStore<{ items: BlogPost[]; loading: boolean; title: string; slug: string; excerpt: string }>({
    items: [],
    loading: true,
    title: "",
    slug: "",
    excerpt: "",
  });

  const refresh = $(async () => {
    try {
      const data = await getBlogPosts();
      const list = Array.isArray(data)
        ? (data as BlogPost[])
        : ((data as { posts?: BlogPost[] })?.posts ?? []);
      state.items = list;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load posts");
    } finally {
      state.loading = false;
    }
  });

  useVisibleTask$(async () => {
    await refresh();
  });

  return (
    <div>
      <h1 class="text-2xl font-bold">Blog</h1>

      <form
        class="card mt-6 space-y-3 p-4"
        preventdefault:submit
        onSubmit$={async () => {
          if (!state.title) return;
          try {
            await createBlogPost({
              title: state.title,
              slug: state.slug || state.title.toLowerCase().replace(/\s+/g, "-"),
              excerpt: state.excerpt,
              content: state.excerpt,
            });
            toast.success("Post created");
            state.title = "";
            state.slug = "";
            state.excerpt = "";
            await refresh();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Create failed");
          }
        }}
      >
        <input class="input" placeholder="Title" bind:value={state.title} />
        <input class="input" placeholder="Slug (optional)" bind:value={state.slug} />
        <textarea class="input min-h-24" placeholder="Excerpt / content" bind:value={state.excerpt} />
        <button type="submit" class="btn-primary">Publish</button>
      </form>

      {state.loading ? (
        <p class="mt-6 text-sm text-slate-500">Loading…</p>
      ) : (
        <div class="mt-6 space-y-3">
          {state.items.map((item) => (
            <div key={item.id} class="card flex items-center justify-between p-4">
              <div>
                <p class="font-medium">{item.title}</p>
                <p class="text-sm text-slate-500">/{item.slug ?? item.id}</p>
              </div>
              <button
                type="button"
                class="text-sm text-rose-500 hover:underline"
                onClick$={async () => {
                  try {
                    await deleteBlogPost(item.id);
                    toast.success("Deleted");
                    await refresh();
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Delete failed");
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
