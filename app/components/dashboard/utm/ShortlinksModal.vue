<script setup lang="ts">
import type { DashboardLink, DashboardLinkListResponse } from '@/types/dashboard-links'
import { AlertCircle, Inbox, LoaderCircle } from '@lucide/vue'
import { useInfiniteScroll } from '@vueuse/core'

const props = defineProps<{
  source: {
    value: string
    label: string
  }
}>()

const open = defineModel<boolean>('open', { default: false })

const links = ref<DashboardLink[]>([])
const listComplete = ref(false)
const listError = ref(false)
const listLoading = ref(false)
const limit = 24
let cursor = ''
let requestGeneration = 0

const { countersMap, counterErrorIds, fetchCounters, resetCounters } = useLinkCounters()
provide(LINKS_COUNTERS_MAP_KEY, countersMap)
provide(LINKS_COUNTER_ERROR_IDS_KEY, counterErrorIds)
provide(RETRY_LINK_COUNTERS_KEY, (id: string) => void fetchCounters([id]))

const scrollContainer = shallowRef<HTMLElement | null>(null)

async function getLinks() {
  if (!props.source.value || listLoading.value || listComplete.value)
    return

  const generation = requestGeneration
  const requestCursor = cursor
  listLoading.value = true
  try {
    const data = await useAPI<DashboardLinkListResponse>('/api/link/list', {
      query: {
        limit,
        cursor: requestCursor,
        sort: 'newest',
        status: 'active',
        utm_source: props.source.value,
      },
    })

    if (generation !== requestGeneration)
      return

    const newLinks = data.links.filter(Boolean)
    const existingSlugs = new Set(links.value.map(link => link.slug))
    links.value = links.value.concat(newLinks.filter(link => !existingSlugs.has(link.slug)))
    cursor = data.cursor ?? ''
    listComplete.value = data.list_complete
    listError.value = false

    const ids = newLinks.map(l => l.id).filter(id => !countersMap.value[id])
    void fetchCounters(ids)
  }
  catch (error) {
    if (generation !== requestGeneration)
      return
    console.error(error)
    listError.value = true
  }
  finally {
    if (generation === requestGeneration)
      listLoading.value = false
  }
}

function resetAndLoad() {
  requestGeneration++
  links.value = []
  resetCounters()
  cursor = ''
  listComplete.value = false
  listError.value = false
  listLoading.value = false

  if (!props.source.value) {
    listComplete.value = true
    return
  }

  void getLinks()
}

useInfiniteScroll(
  scrollContainer,
  getLinks,
  {
    distance: 0,
    interval: 1000,
    canLoadMore: () => {
      return open.value && !!props.source.value && !listError.value && !listComplete.value
    },
  },
)

watch(
  [open, () => props.source.value],
  ([isOpen]) => {
    if (isOpen)
      resetAndLoad()
  },
)
</script>

<template>
  <ResponsiveModal
    v-model:open="open"
    :title="$t('utm.shortlinks_title', { source: source.label })"
    content-class="sm:max-w-2xl md:max-w-2xl"
  >
    <div
      ref="scrollContainer"
      class="
        max-h-[min(60svh,32rem)] space-y-4 overflow-y-auto overscroll-contain
      "
    >
      <section
        v-if="links.length"
        class="grid grid-cols-1 gap-4"
      >
        <DashboardLinksLink
          v-for="link in links"
          :key="link.slug"
          :link="link"
        />
      </section>
      <section
        v-else-if="listLoading"
        class="grid grid-cols-1 gap-4"
        role="status"
        aria-live="polite"
      >
        <DashboardLinksLinkSkeleton v-for="index in 3" :key="index" />
        <span class="sr-only">{{ $t('dashboard.loading') }}</span>
      </section>
      <div
        v-if="links.length && listLoading"
        class="flex min-h-14 items-center justify-center py-4"
        role="status"
        aria-live="polite"
      >
        <LoaderCircle class="motion-safe:animate-spin" aria-hidden="true" />
        <span class="sr-only">{{ $t('dashboard.loading') }}</span>
      </div>
      <Card v-if="!listLoading && listComplete && links.length === 0">
        <CardContent
          class="
            flex min-h-48 flex-col items-center justify-center gap-3 text-center
            text-muted-foreground
          "
        >
          <Inbox class="size-8" aria-hidden="true" />
          <p class="text-sm">
            {{ $t('links.no_filtered_results') }}
          </p>
        </CardContent>
      </Card>
      <Alert
        v-if="listError"
        variant="destructive"
        class="mx-auto max-w-xl"
      >
        <AlertCircle aria-hidden="true" />
        <AlertTitle>{{ $t('links.load_failed') }}</AlertTitle>
        <AlertDescription>
          <Button variant="link" size="sm" class="text-destructive" @click="getLinks">
            {{ $t('common.try_again') }}
          </Button>
        </AlertDescription>
      </Alert>
    </div>

    <template #footer>
      <Button variant="secondary" type="button" @click="open = false">
        {{ $t('common.close') }}
      </Button>
    </template>
  </ResponsiveModal>
</template>
