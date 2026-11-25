<script setup lang="ts">
defineProps<{
  title: string
  existingValues: string[]
}>()

const emit = defineEmits<{
  submit: [option: { value: string, label: string }]
}>()

const open = defineModel<boolean>('open', { default: false })
const formId = 'utm-option-form'

function closeModal() {
  open.value = false
}

function submitOption(option: { value: string, label: string }) {
  emit('submit', option)
  closeModal()
}
</script>

<template>
  <ResponsiveModal
    v-model:open="open"
    :title="title"
    :description="$t('utm.option_dialog_description')"
    content-class="sm:max-w-lg md:max-w-lg"
  >
    <DashboardUtmOptionForm
      v-if="open"
      :form-id="formId"
      :existing-values="existingValues"
      @submit="submitOption"
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
        {{ $t('utm.add') }}
      </Button>
    </template>
  </ResponsiveModal>
</template>
