"use client";
export default function BlogPostClient({ post }: { post: any }) {
  if (!post) {
    return (
      <div className="p-8 text-center text-stone-600 dark:text-stone-400">
        Post not found.
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-4">
        {post.title}
      </h1>
      {post.coverImage && (
        <img
          src={post.coverImage}
          alt={post.title}
          className="w-full h-64 object-cover rounded-lg mb-6"
        />
      )}
      <div className="prose dark:prose-invert max-w-none">
        <p className="text-stone-600 dark:text-stone-400 whitespace-pre-wrap">
          {post.content}
        </p>
      </div>
    </article>
  );
}
