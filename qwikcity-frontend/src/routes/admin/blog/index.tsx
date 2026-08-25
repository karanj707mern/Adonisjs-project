import {
  component$,
  useSignal,
  useStore,
  useVisibleTask$,
  $,
} from "@builder.io/qwik";
import { useLocation } from "@builder.io/qwik-city";
import {
  getAllBlogPosts,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from "~/lib/api/blog";
import { toast } from "~/lib/toast";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
}

export default component$(() => {
  const loc = useLocation();
  const loading = useSignal(true);
  const error = useSignal("");
  const posts = useSignal<BlogPost[]>([]);
  const editingId = useSignal<number | null>(null);
  const saving = useSignal(false);

  const form = useStore({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    coverImage: "",
    published: false,
  });

  const loadPosts = $(async () => {
    try {
      loading.value = true;
      error.value = "";
      const data = await getAllBlogPosts();
      posts.value = Array.isArray(data) ? data : [];
    } catch (err) {
      error.value =
        (err as Error & { status: number }).status === 401
          ? "Session expired. Please log in again."
          : (err as Error).message || "Could not load blog posts.";
    } finally {
      loading.value = false;
    }
  });

  useVisibleTask$(() => {
    loadPosts();
  });

  const resetForm = $(() => {
    form.title = "";
    form.slug = "";
    form.excerpt = "";
    form.content = "";
    form.coverImage = "";
    form.published = false;
    editingId.value = null;
  });

  const startEdit = $((post: BlogPost) => {
    editingId.value = post.id;
    form.title = post.title;
    form.slug = post.slug;
    form.excerpt = post.excerpt || "";
    form.content = post.content;
    form.coverImage = post.coverImage || "";
    form.published = post.published;
  });

  const handleSubmit = $(async () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      saving.value = true;
      const payload = {
        ...form,
        slug:
          form.slug.trim() ||
          form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };

      if (editingId.value) {
        await updateBlogPost(editingId.value, payload);
        toast.success("Post updated");
      } else {
        await createBlogPost(payload);
        toast.success("Post created");
      }
      resetForm();
      await loadPosts();
    } catch (err) {
      toast.error((err as Error).message || "Failed to save post");
    } finally {
      saving.value = false;
    }
  });

  const handleDelete = $(async (id: number) => {
    if (!confirm("Delete this post permanently?")) return;
    try {
      await deleteBlogPost(id);
      toast.success("Post deleted");
      await loadPosts();
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete post");
    }
  });

  const togglePublish = $(async (post: BlogPost) => {
    try {
      await updateBlogPost(post.id, { published: !post.published });
      toast.success(post.published ? "Post unpublished" : "Post published");
      await loadPosts();
    } catch (err) {
      toast.error((err as Error).message || "Failed to update post");
    }
  });

  return (
    <div class="container-page py-10">
      <div class="mb-8">
        <p class="text-sm uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          Content
        </p>
        <h1 class="mt-1 font-serif text-3xl text-slate-900 sm:text-4xl dark:text-slate-100">
          Blog Manager
        </h1>
        <p class="mt-2 text-slate-600 dark:text-slate-300">
          Create, edit, and publish wellness blog posts.
        </p>
      </div>

      {error.value && (
        <div class="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error.value}
        </div>
      )}

      {/* Editor */}
      <div class="card mb-8 space-y-4 p-6">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {editingId.value ? "Edit Post" : "New Post"}
        </h2>
        <input
          class="input"
          placeholder="Post title"
          value={form.title}
          onInput$={(e, el) => (form.title = el.value)}
        />
        <input
          class="input"
          placeholder="Slug (auto-generated from title if empty)"
          value={form.slug}
          onInput$={(e, el) => (form.slug = el.value)}
        />
        <input
          class="input"
          placeholder="Excerpt"
          value={form.excerpt}
          onInput$={(e, el) => (form.excerpt = el.value)}
        />
        <textarea
          class="input min-h-[200px]"
          placeholder="Content (HTML supported)"
          value={form.content}
          onInput$={(e, el) => (form.content = el.value)}
        />
        <input
          class="input"
          placeholder="Cover image URL"
          value={form.coverImage}
          onInput$={(e, el) => (form.coverImage = el.value)}
        />
        <label class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={form.published}
            onChange$={() => (form.published = !form.published)}
          />
          Published
        </label>
        <div class="flex gap-3">
          <button
            type="button"
            class="btn-primary"
            disabled={saving.value}
            onClick$={handleSubmit}
          >
            {saving.value
              ? "Saving..."
              : editingId.value
                ? "Update Post"
                : "Create Post"}
          </button>
          {editingId.value && (
            <button type="button" class="btn-vibrant" onClick$={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Post list */}
      <div class="card p-6">
        <h2 class="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
          All Posts {loading.value && "(loading...)"}
        </h2>
        {posts.value.length === 0 && !loading.value && (
          <p class="text-sm text-slate-500">
            No blog posts yet. Create your first post above.
          </p>
        )}
        <div class="space-y-3">
          {posts.value.map((post) => (
            <div
              key={post.id}
              class="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800"
            >
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <h3 class="truncate font-medium text-slate-900 dark:text-slate-100">
                    {post.title}
                  </h3>
                  <span
                    class={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      post.published
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>
                </div>
                <p class="mt-1 truncate text-sm text-slate-500">{post.slug}</p>
              </div>
              <div class="flex shrink-0 gap-2">
                <button
                  type="button"
                  class="btn-nav text-xs"
                  onClick$={() => togglePublish(post)}
                >
                  {post.published ? "Unpublish" : "Publish"}
                </button>
                <button
                  type="button"
                  class="btn-nav text-xs"
                  onClick$={() => startEdit(post)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  class="btn-vibrant text-xs"
                  onClick$={() => handleDelete(post.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
