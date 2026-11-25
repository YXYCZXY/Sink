<script setup lang="ts">
import type { UtmOption } from './utm-presets'
import { ensureUtmOption, sanitizeUtmAssetId } from './utm-presets'

const props = defineProps<{
  formId: string
  categories: UtmOption[]
  themes: UtmOption[]
}>()

const category = defineModel<string>('category', { default: '' })
const theme = defineModel<string>('theme', { default: '' })
const assetId = defineModel<string>('assetId', { default: '' })

const categoryOptions = computed(() => ensureUtmOption(props.categories, category.value))
const themeOptions = computed(() => ensureUtmOption(props.themes, theme.value))

const categoryId = computed(() => `${props.formId}-utm-content-category`)
const themeId = computed(() => `${props.formId}-utm-content-theme`)
const assetIdFieldId = computed(() => `${props.formId}-utm-content-asset`)

function optionLabel(options: UtmOption[], value: string) {
  return options.find(option => option.value === value)?.label ?? value
}

function updateCategory(value: unknown) {
  category.value = typeof value === 'string' ? value : ''
}

function updateTheme(value: unknown) {
  theme.value = typeof value === 'string' ? value : ''
}

function updateAssetId(value: string | number) {
  assetId.value = sanitizeUtmAssetId(String(value))
}
</script>

<template>
  <Field>
    <FieldTitle>
      {{ $t('links.form.utm_content') }}
    </FieldTitle>

    <div
      class="
        grid gap-4
        sm:grid-cols-3 sm:items-end
      "
    >
      <div class="grid gap-2">
        <Label :for="categoryId">
          {{ $t('links.form.utm_content_category') }}
        </Label>
        <Select
          :model-value="category || undefined"
          @update:model-value="updateCategory"
        >
          <SelectTrigger :id="categoryId" class="w-full">
            <SelectValue :placeholder="$t('links.form.utm_content_category_placeholder')">
              {{ category ? optionLabel(categoryOptions, category) : $t('links.form.utm_content_category_placeholder') }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem
              v-for="option in categoryOptions"
              :key="option.value"
              :value="option.value"
              :text-value="`${option.label} ${option.value}`"
              class="**:data-[slot=select-item-text]:flex-1"
            >
              <span class="flex min-w-0 flex-1 items-center gap-3">
                <span class="truncate">{{ option.label }}</span>
                <span class="ml-auto font-mono text-xs text-muted-foreground">{{ option.value }}</span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label :for="themeId">
          {{ $t('links.form.utm_content_theme') }}
        </Label>
        <Select
          :model-value="theme || undefined"
          @update:model-value="updateTheme"
        >
          <SelectTrigger :id="themeId" class="w-full">
            <SelectValue :placeholder="$t('links.form.utm_content_theme_placeholder')">
              {{ theme ? optionLabel(themeOptions, theme) : $t('links.form.utm_content_theme_placeholder') }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent position="popper" align="start">
            <SelectItem
              v-for="option in themeOptions"
              :key="option.value"
              :value="option.value"
              :text-value="`${option.label} ${option.value}`"
              class="**:data-[slot=select-item-text]:flex-1"
            >
              <span class="flex min-w-0 flex-1 items-center gap-3">
                <span class="truncate">{{ option.label }}</span>
                <span class="ml-auto font-mono text-xs text-muted-foreground">{{ option.value }}</span>
              </span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="grid gap-2">
        <Label :for="assetIdFieldId">
          {{ $t('links.form.utm_content_asset') }}
        </Label>
        <Input
          :id="assetIdFieldId"
          :model-value="assetId"
          name="utm_content_asset"
          autocomplete="off"
          :placeholder="$t('links.form.utm_content_asset_placeholder')"
          @update:model-value="updateAssetId"
        />
      </div>
    </div>
  </Field>
</template>
