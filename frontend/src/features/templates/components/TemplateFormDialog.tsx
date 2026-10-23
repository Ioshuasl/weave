'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { TagsInput } from '@/features/tags/components/TagsInput'
import { Button } from '@/shared/ui/Button'
import { InputField } from '@/shared/ui/Field'
import { templateFormSchema, type TemplateFormValues } from '../schemas/templates.schemas'

interface Props {
  title: string
  submitLabel: string
  initial?: Partial<TemplateFormValues>
  /** true = modelo pronto (só tags do sistema; painel do suporte) */
  system?: boolean
  onClose: () => void
  onSubmit: (values: TemplateFormValues) => Promise<boolean>
}

export const TemplateFormDialog = ({ title, submitLabel, initial, system = false, onClose, onSubmit }: Props) => {
  const { register, handleSubmit, control, formState } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: { name: initial?.name ?? '', description: initial?.description ?? '', tagIds: initial?.tagIds ?? [] },
  })
  const { errors, isSubmitting } = formState

  const handleForm = handleSubmit(async (values) => {
    if (await onSubmit(values)) onClose()
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 p-4" role="dialog" aria-modal="true" aria-labelledby="tpl-title">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface shadow-lg">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 id="tpl-title" className="text-md font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar"><X className="size-4" aria-hidden /></Button>
        </header>
        <form onSubmit={handleForm} noValidate className="flex flex-col gap-4 p-4">
          <InputField label="Nome" error={errors.name?.message} {...register('name')} />
          <InputField label="Descrição (opcional)" error={errors.description?.message} {...register('description')} />
          <Controller
            control={control}
            name="tagIds"
            render={({ field }) => <TagsInput label="Tags" value={field.value} onChange={field.onChange} system={system} error={errors.tagIds?.message} />}
          />
          <footer className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
          </footer>
        </form>
      </div>
    </div>
  )
}
