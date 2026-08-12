import { component$ } from '@builder.io/qwik'

interface InfoPageProps {
  title: string
  content: string
}

export const InfoPage = component$<InfoPageProps>((props) => {
  return (
    <div class="max-w-4xl mx-auto">
      <h1 class="text-4xl font-bold text-stone-800 dark:text-stone-100 mb-8">
        {props.title}
      </h1>
      <div class="prose prose-lg dark:prose-invert max-w-none">
        <p class="text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line">
          {props.content}
        </p>
      </div>
    </div>
  )
})
