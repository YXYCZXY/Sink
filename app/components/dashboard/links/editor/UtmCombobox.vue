<script setup lang="ts">
import type { UtmOption } from './utm-presets'
import { ChevronsUpDown } from '@lucide/vue'
import { ComboboxInput } from 'reka-ui'
import { cn } from '@/lib/utils'

withDefaults(defineProps<{
  id?: string
  name?: string
  modelValue?: string
  options: UtmOption[]
  placeholder?: string
  autofocus?: boolean
}>(), {
  modelValue: '',
  placeholder: '',
  autofocus: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)

function onSelect(value: unknown) {
  emit('update:modelValue', typeof value === 'string' ? value : '')
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <Combobox
    v-model:open="open"
    :model-value="modelValue"
    open-on-click
    @update:model-value="onSelect"
  >
    <ComboboxAnchor
      :class="cn(
        `
          flex h-9 w-full items-center rounded-4xl border border-input
          bg-input/30 transition-colors
        `,
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
      )"
    >
      <ComboboxInput
        :id="id"
        :name="name"
        :auto-focus="autofocus"
        :placeholder="placeholder"
        :display-value="(value: unknown) => typeof value === 'string' ? value : ''"
        class="
          min-w-0 flex-1 bg-transparent px-3 py-1 text-base outline-none
          placeholder:text-muted-foreground
          md:text-sm
        "
        @input="onInput"
      />
      <ComboboxTrigger
        type="button"
        class="shrink-0 px-3 text-muted-foreground"
        :aria-label="placeholder"
      >
        <ChevronsUpDown aria-hidden="true" class="size-4 opacity-50" />
      </ComboboxTrigger>
    </ComboboxAnchor>
    <ComboboxList>
      <ComboboxViewport>
        <ComboboxEmpty>无匹配预设，可直接输入自定义值</ComboboxEmpty>
        <ComboboxItem
          v-for="option in options"
          :key="option.value"
          :value="option.value"
          :text-value="`${option.value} ${option.label}`"
        >
          <span class="truncate">{{ option.label }}</span>
          <span class="ml-auto font-mono text-xs text-muted-foreground">{{ option.value }}</span>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxList>
  </Combobox>
</template>
