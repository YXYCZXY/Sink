<script setup lang="ts">
import type { UtmBranchKey, UtmSourceEntry } from './catalog'
import type { UtmFieldPresets, UtmOption } from '@/components/dashboard/links/editor/utm-presets'
import { GripVertical, Link2, Plus, Search, Trash2, X } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { useUtmCatalog } from './catalog'

interface BranchConfig {
  key: UtmBranchKey
  title: string
  param?: string
  addLabel: string
}

const { t } = useI18n()
const catalog = useUtmCatalog()

const loading = computed(() => !catalog.loaded.value)

onMounted(async () => {
  try {
    await catalog.refresh()
  }
  catch {
    toast.error(t('utm.load_failed'))
  }
})

const query = shallowRef('')
const selected = shallowRef('')
const shortlinksOpen = shallowRef(false)
const sourceModalOpen = shallowRef(false)
const deleteDialogOpen = shallowRef(false)
const deleteTargetLabel = shallowRef('')
const optionModal = shallowRef<{ branch: BranchConfig, sourceValue: string } | null>(null)
const shortlinkCount = shallowRef<number | null>(null)
let shortlinkCountGeneration = 0

const sources = computed<UtmSourceEntry[]>(() => catalog.sources.value)

const filteredSources = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  if (!keyword)
    return sources.value
  return sources.value.filter(source =>
    source.label.toLowerCase().includes(keyword)
    || source.value.toLowerCase().includes(keyword),
  )
})

const activeSource = computed((): UtmSourceEntry | undefined =>
  sources.value.find(source => source.value === selected.value) ?? sources.value[0],
)

function emptyUtmPresets(): UtmFieldPresets {
  return {
    medium: [],
    campaign: [],
    term: [],
    content: { categories: [], themes: [] },
  }
}

const presets = computed(() => activeSource.value?.presets ?? emptyUtmPresets())

const branches = computed(() => [
  { key: 'medium', title: t('utm.medium'), param: 'utm_medium', options: presets.value.medium, addLabel: t('utm.add_medium') },
  { key: 'campaign', title: t('utm.campaign'), param: 'utm_campaign', options: presets.value.campaign, addLabel: t('utm.add_campaign') },
  { key: 'term', title: t('utm.term'), param: 'utm_term', options: presets.value.term, addLabel: t('utm.add_term') },
] satisfies Array<BranchConfig & { options: UtmOption[] }>)

const contentBranches = computed(() => [
  { key: 'categories', title: t('utm.category'), options: presets.value.content.categories, addLabel: t('utm.add_category') },
  { key: 'themes', title: t('utm.theme'), options: presets.value.content.themes, addLabel: t('utm.add_theme') },
] satisfies Array<BranchConfig & { options: UtmOption[] }>)

const optionExistingValues = computed(() => optionModal.value
  ? catalog.branchOptions(optionModal.value.sourceValue, optionModal.value.branch.key).map(option => option.value)
  : [])

function selectSource(source: UtmSourceEntry) {
  selected.value = source.value
}

async function refreshShortlinkCount() {
  const generation = ++shortlinkCountGeneration
  const sourceValue = activeSource.value?.value
  if (!sourceValue) {
    shortlinkCount.value = 0
    return
  }

  shortlinkCount.value = null
  try {
    const { count } = await useAPI<{ count: number }>('/api/link/count', {
      query: {
        status: 'active',
        utm_source: sourceValue,
      },
    })
    if (generation === shortlinkCountGeneration)
      shortlinkCount.value = count
  }
  catch {
    if (generation === shortlinkCountGeneration)
      shortlinkCount.value = null
  }
}

watch(
  () => activeSource.value?.value,
  () => {
    void refreshShortlinkCount()
  },
  { immediate: true },
)

watch(shortlinksOpen, (isOpen, wasOpen) => {
  if (wasOpen && !isOpen)
    void refreshShortlinkCount()
})

function optionKey(branch: string, option: UtmOption) {
  return `${branch}:${option.value}`
}

function openBranchModal(branch: BranchConfig) {
  const source = activeSource.value
  if (!source)
    return
  optionModal.value = { branch, sourceValue: source.value }
}

async function submitSource(entry: { value: string, label: string }) {
  try {
    if (!await catalog.addSource(entry))
      return
    query.value = ''
    selected.value = entry.value
  }
  catch {
    toast.error(t('utm.save_failed'))
  }
}

async function submitOption(option: UtmOption) {
  const target = optionModal.value
  if (!target)
    return
  try {
    await catalog.addOption(target.sourceValue, target.branch.key, option)
  }
  catch {
    toast.error(t('utm.save_failed'))
  }
}

async function removeBranchOption(branch: BranchConfig, option: UtmOption) {
  const source = activeSource.value
  if (!source)
    return
  try {
    await catalog.removeOption(source.value, branch.key, option.value)
  }
  catch {
    toast.error(t('utm.save_failed'))
  }
}

function openDeleteDialog() {
  const source = activeSource.value
  if (!source)
    return
  deleteTargetLabel.value = source.label
  deleteDialogOpen.value = true
}

async function confirmDeleteSource() {
  const source = activeSource.value
  if (!source)
    return
  try {
    const removedIndex = await catalog.removeSource(source.value)
    if (removedIndex === -1)
      return
    const next = sources.value[Math.min(removedIndex, sources.value.length - 1)]
    selected.value = next?.value ?? ''
  }
  catch {
    toast.error(t('utm.save_failed'))
  }
}
</script>

<template>
  <div
    v-if="loading"
    class="
      rounded-2xl border border-dashed p-6 text-center text-sm
      text-muted-foreground
    "
  >
    {{ $t('utm.loading') }}
  </div>
  <div
    v-else-if="!sources.length"
    class="
      flex flex-col items-center gap-4 rounded-2xl border border-dashed p-8
      text-center text-sm text-muted-foreground
    "
  >
    <p>{{ $t('utm.empty_sources') }}</p>
    <Button variant="outline" size="sm" type="button" @click="sourceModalOpen = true">
    <Plus class="size-3.5" />
      {{ $t('utm.new_source') }}
    </Button>
  </div>
  <div
    v-else
    class="
      flex flex-col gap-6
      lg:flex-row
    "
  >
    <!-- Left column: source list -->
    <aside
      class="
        flex w-full shrink-0 flex-col gap-4
        lg:w-[360px]
      "
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h2
            class="
              text-xs font-semibold tracking-wider text-muted-foreground
              uppercase
            "
          >
            {{ $t('utm.sources') }}
          </h2>
          <Badge variant="secondary">
            {{ filteredSources.length }}
          </Badge>
        </div>
        <Button variant="outline" size="sm" type="button" @click="sourceModalOpen = true">
          <Plus class="size-3.5" />
          {{ $t('utm.new_source') }}
        </Button>
      </div>

      <div class="relative">
        <Search
          class="
            absolute top-1/2 left-3 size-3.5 -translate-y-1/2
            text-muted-foreground
          "
        />
        <Input
          v-model="query"
          type="text"
          :placeholder="$t('utm.filter_placeholder')"
          class="pl-8"
        />
      </div>

      <div class="space-y-2">
        <button
          v-for="source in filteredSources"
          :key="source.value"
          type="button"
          class="
            flex w-full items-center gap-2.5 rounded-2xl border bg-card p-3
            text-left transition-colors
            hover:border-ring
          "
          :class="source.value === selected
            ? 'border-primary ring-1 ring-primary'
            : 'border-border'"
          @click="selectSource(source)"
        >
          <span
            class="size-2 shrink-0 rounded-full"
            :class="source.value === selected ? 'bg-primary' : `
              bg-muted-foreground/40
            `"
          />
          <span class="min-w-0">
            <span class="block truncate text-xs font-medium text-foreground">
              {{ source.label }}
            </span>
            <code class="block truncate text-[11px] text-muted-foreground">
              {{ source.value }}
            </code>
          </span>
        </button>
      </div>
    </aside>

    <!-- Right column: branch management -->
    <section v-if="activeSource" class="flex min-w-0 flex-1 flex-col gap-5">
      <!-- Active source header -->
      <Card size="sm" class="flex-row items-center justify-between gap-4 px-4">
        <h2 class="text-sm font-bold">
          {{ activeSource.label }}
        </h2>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" type="button" @click="shortlinksOpen = true">
            <Link2 class="size-3.5" />
            {{ $t('utm.view_shortlinks') }}
            <Badge v-if="shortlinkCount !== null" variant="secondary" class="font-mono">
              {{ shortlinkCount }}
            </Badge>
          </Button>
          <Button
            variant="ghost" size="sm" type="button" class="text-destructive"
            @click="openDeleteDialog"
          >
            <Trash2 class="size-3.5" />
            {{ $t('utm.delete_source') }}
          </Button>
        </div>
      </Card>

      <!-- Standard branches: medium / campaign / term -->
      <div
        class="
          grid grid-cols-[repeat(auto-fit,minmax(min(100%,26rem),1fr))] gap-4
        "
      >
        <Card
          v-for="branch in branches" :key="branch.key" size="sm" class="h-full"
        >
          <CardHeader class="border-b">
            <CardTitle class="text-xs font-bold">
              {{ branch.title }}
            </CardTitle>
            <CardDescription class="font-mono text-[11px]">
              {{ branch.param }}
            </CardDescription>
            <CardAction class="self-center">
              <Button
                variant="outline"
                size="icon-xs"
                type="button"
                :aria-label="branch.addLabel"
                :title="branch.addLabel"
                @click="openBranchModal(branch)"
              >
                <Plus />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent
            class="
              grid flex-1
              grid-cols-[repeat(auto-fit,minmax(max(11rem,calc(50%-0.1875rem)),1fr))]
              content-start gap-1.5
            "
          >
            <p
              v-if="!branch.options.length"
              class="
                col-span-2 rounded-lg border border-dashed p-2 text-center
                text-[11px] text-muted-foreground
              "
            >
              {{ $t('utm.empty_options') }}
            </p>
            <div
              v-for="option in branch.options"
              :key="optionKey(branch.key, option)"
              class="
                group flex items-center gap-1.5 rounded-lg bg-muted/50 px-2
                py-1.5 whitespace-nowrap transition-colors
                hover:bg-muted
              "
            >
              <GripVertical
                class="size-3.5 shrink-0 cursor-grab text-muted-foreground/50"
              />
              <span class="text-xs font-medium">{{ option.label }}</span>
              <code class="text-[10px] text-muted-foreground">{{ option.value }}</code>
              <button
                type="button"
                class="
                  ml-auto shrink-0 p-0.5 text-muted-foreground opacity-0
                  transition-opacity
                  group-hover:opacity-100
                  hover:text-destructive
                "
                :aria-label="$t('utm.delete_option', { label: option.label })"
                @click="removeBranchOption(branch, option)"
              >
                <X class="size-3.5" />
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Compound branch: utm_content -->
      <Card>
        <CardHeader class="border-b">
          <CardTitle class="text-xs font-bold">
            {{ $t('utm.content') }}
          </CardTitle>
          <CardDescription class="font-mono text-[11px]">
            utm_content
          </CardDescription>
        </CardHeader>
        <CardContent
          class="
            grid grid-cols-1 gap-4
            md:grid-cols-2
          "
        >
          <div
            v-for="branch in contentBranches"
            :key="branch.key"
            class="flex h-full flex-col rounded-xl border bg-muted/30 p-3"
          >
            <div class="flex items-center justify-between border-b pb-2">
              <span class="text-xs font-semibold">{{ branch.title }}</span>
              <Button
                variant="outline"
                size="icon-xs"
                type="button"
                :aria-label="branch.addLabel"
                :title="branch.addLabel"
                @click="openBranchModal(branch)"
              >
                <Plus />
              </Button>
            </div>
            <div
              class="
                mt-2 grid flex-1
                grid-cols-[repeat(auto-fit,minmax(max(8rem,calc(50%-0.1875rem)),1fr))]
                content-start gap-1.5
              "
            >
              <p
                v-if="!branch.options.length"
                class="
                  col-span-2 rounded-lg border border-dashed bg-card p-2
                  text-center text-[11px] text-muted-foreground
                "
              >
                {{ $t('utm.empty_options') }}
              </p>
              <div
                v-for="option in branch.options"
                :key="optionKey(branch.key, option)"
                class="
                  group flex items-center gap-1.5 rounded-lg border bg-card px-2
                  py-1.5 whitespace-nowrap
                "
              >
                <GripVertical
                  class="size-3.5 shrink-0 cursor-grab text-muted-foreground/50"
                />
                <span class="text-xs font-medium">{{ option.label }}</span>
                <code class="text-[10px] text-muted-foreground">{{ option.value }}</code>
                <button
                  type="button"
                  class="
                    ml-auto shrink-0 p-0.5 text-muted-foreground opacity-0
                    transition-opacity
                    group-hover:opacity-100
                    hover:text-destructive
                  "
                  :aria-label="$t('utm.delete_option', { label: option.label })"
                  @click="removeBranchOption(branch, option)"
                >
                  <X class="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>

    <DashboardUtmShortlinksModal
      v-if="activeSource"
      v-model:open="shortlinksOpen"
      :source="activeSource"
    />
    <DashboardUtmOptionModal
      :open="optionModal !== null"
      :title="optionModal?.branch.addLabel ?? ''"
      :existing-values="optionExistingValues"
      @update:open="!$event && (optionModal = null)"
      @submit="submitOption"
    />
    <DashboardUtmDeleteSourceDialog
      v-model:open="deleteDialogOpen"
      :source-label="deleteTargetLabel"
      @confirm="confirmDeleteSource"
    />
  </div>

  <DashboardUtmSourceModal
    v-model:open="sourceModalOpen"
    :existing-values="catalog.sourceValues()"
    @submit="submitSource"
  />
</template>
