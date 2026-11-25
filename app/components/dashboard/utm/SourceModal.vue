<script setup lang="ts">
defineProps<{
  existingValues: string[]
}>()

const emit = defineEmits<{
  submit: [entry: { value: string, label: string }]
}>()

const open = defineModel<boolean>('open', { default: false })
const formId = 'utm-source-form'

function closeModal() {
  open.value = false
}

function submitSource(entry: { value: string, label: string }) {
  emit('submit', entry)
  closeModal()
}
</script>

<template>
  <ResponsiveModal
    v-model:open="open"
    :title="$t('utm.new_source')"
    :description="$t('utm.source_dialog_description')"
    content-class="sm:max-w-lg md:max-w-lg"
  >
    <DashboardUtmSourceForm
      v-if="open"
      :form-id="formId"
      :existing-values="existingValues"
      @submit="submitSource"
    />

    <template #footer>
      <Button
        type="button"
        variant="secondary"
        @click="closeModal"
      >
        {{ $t('common.cancel') }}
      </Button>
      <Button
        type="submit"
        :form="formId"
      >
        {{ $t('utm.create') }}
      </Button>
    </template>
  </ResponsiveModal>
</template>
