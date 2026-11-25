<script setup lang="ts">
import { useForm } from '@tanstack/vue-form'
import { z } from 'zod'
import { isDuplicateUtmToken, normalizeUtmToken, utmTokenPattern } from './catalog'

const props = defineProps<{
  formId: string
  existingValues: string[]
}>()

const emit = defineEmits<{
  submit: [option: { value: string, label: string }]
}>()

const { t } = useI18n()

const form = useForm({
  defaultValues: {
    label: '',
    value: '',
  },
  onSubmit: ({ value }) => {
    emit('submit', {
      label: value.label.trim(),
      value: normalizeUtmToken(value.value),
    })
  },
})

const labelSchema = z.string().trim().min(1, t('utm.validation.required'))
const tokenSchema = z.string()
  .trim()
  .min(1, t('utm.validation.required'))
  .regex(utmTokenPattern, t('utm.validation.token_format'))

const validateLabel = makeZodValidator(labelSchema)

function validateToken({ value }: { value: unknown }) {
  const error = makeZodValidator(tokenSchema)({ value })
  if (error)
    return error
  if (isDuplicateUtmToken(props.existingValues, String(value)))
    return t('utm.validation.duplicate')
  return undefined
}
</script>

<template>
  <form :id="formId" class="space-y-4" @submit.prevent="form.handleSubmit">
    <FieldGroup>
      <form.Field
        v-slot="{ field }"
        name="label"
        :validators="{ onBlur: validateLabel, onSubmit: validateLabel }"
      >
        <Field :data-invalid="isInvalid(field)">
          <FieldLabel :for="`${formId}-${field.name}`">
            {{ $t('utm.name') }}
          </FieldLabel>
          <Input
            :id="`${formId}-${field.name}`"
            :name="field.name"
            :model-value="field.state.value"
            :aria-invalid="getAriaInvalid(field)"
            autocomplete="off"
            @blur="field.handleBlur"
            @input="field.handleChange(($event.target as HTMLInputElement).value)"
          />
          <FieldError v-if="isInvalid(field)" :errors="field.state.meta.errors" />
        </Field>
      </form.Field>

      <form.Field
        v-slot="{ field }"
        name="value"
        :validators="{ onBlur: validateToken, onSubmit: validateToken }"
      >
        <Field :data-invalid="isInvalid(field)">
          <FieldLabel :for="`${formId}-${field.name}`">
            {{ $t('utm.token') }}
          </FieldLabel>
          <Input
            :id="`${formId}-${field.name}`"
            :name="field.name"
            :model-value="field.state.value"
            :aria-invalid="getAriaInvalid(field)"
            :aria-describedby="`${formId}-${field.name}-hint`"
            placeholder="banner"
            autocomplete="off"
            autocapitalize="none"
            spellcheck="false"
            @blur="field.handleBlur"
            @input="field.handleChange(($event.target as HTMLInputElement).value)"
          />
          <FieldDescription v-if="!isInvalid(field)" :id="`${formId}-${field.name}-hint`">
            {{ $t('utm.token_hint') }}
          </FieldDescription>
          <FieldError v-else :errors="field.state.meta.errors" />
        </Field>
      </form.Field>
    </FieldGroup>
  </form>
</template>
