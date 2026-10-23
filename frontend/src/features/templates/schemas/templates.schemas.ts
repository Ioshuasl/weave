import { z } from 'zod'

export const templateFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do modelo').max(120),
  description: z.string().trim().max(500).optional(),
  tagIds: z.array(z.string()).max(20, 'No máximo 20 tags'),
})
export type TemplateFormValues = z.infer<typeof templateFormSchema>
