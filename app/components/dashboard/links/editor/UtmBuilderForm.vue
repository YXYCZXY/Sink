<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { parseQuery, parseURL, withQuery } from 'ufo'
import { toast } from 'vue-sonner'
import { UrlSchema } from '#shared/schemas/link'
import { useUtmCatalog } from '@/components/dashboard/utm/catalog'
import { composeUtmContent, parseUtmContent } from './utm-presets'

interface UtmFormValues {
  source: string
  medium: string
  campaign: string
  term: string
  contentCategory: string
  contentTheme: string
  contentAssetId: string
}

const props = defineProps<{
  url: string
  formId: string
}>()

const emit = defineEmits<{
  'apply': [url: string]
  'update:canApply': [value: boolean]
}>()

const { t } = useI18n()
const isDesktop = useMediaQuery('(min-width: 640px)')
const catalog = useUtmCatalog()
const utmValues = reactive<UtmFormValues>(createEmptyUtmValues())

onMounted(() => {
  if (!catalog.loaded.value)
    catalog.refresh().catch(() => {})
})

const validatedUrl = computed(() => {
  const result = UrlSchema.safeParse(props.url)
  return result.success ? result.data : undefined
})

const previewUrl = computed(() => {
  if (!validatedUrl.value)
    return ''

  return withQuery(validatedUrl.value, buildUtmQuery(utmValues))
})

const validatedPreviewUrl = computed(() => {
  if (!previewUrl.value)
    return undefined

  const result = UrlSchema.safeParse(previewUrl.value)
  return result.success ? result.data : undefined
})

const sourceOptions = computed(() =>
  catalog.sources.value.map(source => ({ value: source.value, label: source.label })),
)

const fieldPresets = computed(() => catalog.fieldPresets(utmValues.source))

const canApply = computed(() => Boolean(validatedUrl.value && validatedPreviewUrl.value))

watch(canApply, value => emit('update:canApply', value), { immediate: true })

syncUtmValues(props.url)

function createEmptyUtmValues(): UtmFormValues {
  return {
    source: '',
    medium: '',
    campaign: '',
    term: '',
    contentCategory: '',
    contentTheme: '',
    contentAssetId: '',
  }
}

function getQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function normalizeUtmValue(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

function buildUtmQuery(values: UtmFormValues) {
  return {
    utm_source: normalizeUtmValue(values.source),
    utm_medium: normalizeUtmValue(values.medium),
    utm_campaign: normalizeUtmValue(values.campaign),
    utm_term: normalizeUtmValue(values.term),
    utm_content: normalizeUtmValue(composeUtmContent({
      category: values.contentCategory,
      theme: values.contentTheme,
      assetId: values.contentAssetId,
    })),
  }
}

function syncUtmValues(url: string) {
  Object.assign(utmValues, createEmptyUtmValues())

  const result = UrlSchema.safeParse(url)
  if (!result.success)
    return

  const { search } = parseURL(result.data)
  const query = parseQuery(search)

  utmValues.source = getQueryValue(query.utm_source)
  utmValues.medium = getQueryValue(query.utm_medium)
  utmValues.campaign = getQueryValue(query.utm_campaign)
  utmValues.term = getQueryValue(query.utm_term)

  const content = parseUtmContent(
    getQueryValue(query.utm_content),
    catalog.fieldPresets(utmValues.source).content,
  )
  utmValues.contentCategory = content.category
  utmValues.contentTheme = content.theme
  utmValues.contentAssetId = content.assetId
}

function clearUtmValues() {
  Object.assign(utmValues, createEmptyUtmValues())
}

function onSourceChange(value: string) {
  utmValues.source = value
  utmValues.medium = ''
  utmValues.campaign = ''
  utmValues.term = ''
  utmValues.contentCategory = ''
  utmValues.contentTheme = ''
  utmValues.contentAssetId = ''
}

function submitForm() {
  if (!validatedPreviewUrl.value) {
    toast.error(t('links.form.utm_invalid_url'))
    return
  }

  emit('apply', validatedPreviewUrl.value)
}
</script>

<template>
  <form
    :id="formId"
    class="w-full"
    @submit.prevent="submitForm"
    @reset.prevent="clearUtmValues"
  >
    <div class="w-full space-y-5 px-1">
      <FieldGroup>
        <div
          class="
            grid gap-4
            md:grid-cols-2
          "
        >
          <Field>
            <FieldLabel :for="`${formId}-utm-source`">
              {{ $t('links.form.utm_source') }}
            </FieldLabel>
            <DashboardLinksEditorUtmCombobox
              :id="`${formId}-utm-source`"
              :model-value="utmValues.source"
              name="utm_source"
              :options="sourceOptions"
              :autofocus="isDesktop"
              placeholder="youtube"
              @update:model-value="onSourceChange"
            />
          </Field>

          <Field>
            <FieldLabel :for="`${formId}-utm-medium`">
              {{ $t('links.form.utm_medium') }}
            </FieldLabel>
            <DashboardLinksEditorUtmCombobox
              :id="`${formId}-utm-medium`"
              v-model="utmValues.medium"
              name="utm_medium"
              :options="fieldPresets.medium"
              placeholder="video"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel :for="`${formId}-utm-campaign`">
            {{ $t('links.form.utm_campaign') }}
          </FieldLabel>
          <DashboardLinksEditorUtmCombobox
            :id="`${formId}-utm-campaign`"
            v-model="utmValues.campaign"
            name="utm_campaign"
            :options="fieldPresets.campaign"
            placeholder="channel"
          />
        </Field>

        <Field>
          <FieldLabel :for="`${formId}-utm-term`">
            {{ $t('links.form.utm_term') }}
          </FieldLabel>
          <DashboardLinksEditorUtmCombobox
            :id="`${formId}-utm-term`"
            v-model="utmValues.term"
            name="utm_term"
            :options="fieldPresets.term"
            placeholder="tutorial"
          />
        </Field>

        <DashboardLinksEditorUtmContentField
          v-model:category="utmValues.contentCategory"
          v-model:theme="utmValues.contentTheme"
          v-model:asset-id="utmValues.contentAssetId"
          :form-id="formId"
          :categories="fieldPresets.content.categories"
          :themes="fieldPresets.content.themes"
        />

        <Field>
          <div class="space-y-2">
            <FieldLabel>{{ $t('links.form.utm_preview') }}</FieldLabel>
            <div
              class="
                rounded-md border bg-muted/50 p-3 font-mono text-xs/5 break-all
                sm:text-sm
              "
              :class="!previewUrl && 'text-muted-foreground'"
            >
              {{ previewUrl || $t('links.form.utm_invalid_url') }}
            </div>
          </div>
        </Field>
      </FieldGroup>
    </div>
  </form>
</template>
