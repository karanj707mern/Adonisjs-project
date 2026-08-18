"use client";

export default function BlogListClient({
  initialPosts,
  initialError,
}: {
  initialPosts: any[];
  initialError: string;
}) {
  if (initialError) {
    return <div className="p-8 text-center text-red-600">{initialError}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-stone-900 dark:text-stone-100 mb-8">
        Wellness Journal
      </h1>
      {initialPosts.length === 0 ? (
        <p className="text-stone-600 dark:text-stone-400">No blog posts yet.</p>
      ) : (
        <div className="space-y-8">
          {initialPosts.map((post: any) => (
            <article
              key={post.id}
              className="bg-white dark:bg-stone-800 rounded-lg shadow overflow-hidden"
            >
              {post.coverImage && (
                <img
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-2">
                  <a
                    href={"/blog/" + post.slug}
                    className="hover:text-emerald-700"
                  >
                    {post.title}
                  </a>
                </h2>
                <p className="text-stone-600 dark:text-stone-400 mb-4">
                  {post.excerpt}
                </p>
                <a
                  href={"/blog/" + post.slug}
                  className="text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Read more →
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
