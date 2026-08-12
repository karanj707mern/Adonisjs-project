import { component$, useSignal } from '@builder.io/qwik'
import type { PropFunction } from '@builder.io/qwik'

interface SkeletonProps {
  width?: string
  height?: string
  class?: string
}

export const Skeleton = component$<SkeletonProps>((props) => {
  return (
    <div
      class={`animate-pulse bg-stone-200 dark:bg-stone-700 rounded ${
        props.class || ''
      }`}
      style={{
        width: props.width || '100%',
        height: props.height || '200px',
      }}
    />
  )
})

export const ProductCardSkeleton = component$(() => {
  return (
    <div class="card">
      <Skeleton height="256px" class="mb-4" />
      <Skeleton height="20px" width="75%" class="mb-2" />
      <Skeleton height="24px" width="50%" />
    </div>
  )
})
