import { z } from 'zod';

export const IngredientSchema = z.object({
  raw: z.string(),
  amount: z.number().nullable(),
  unit: z.string().nullable(),
  name: z.string(),
  optional: z.boolean().optional(),
  group: z.string().optional(),
});

export const InstructionSchema = z.object({
  step: z.number(),
  text: z.string(),
  duration_minutes: z.number().nullable().optional(),
  temperature_c: z.number().nullable().optional(),
  tip: z.string().nullable().optional(),
});

export const FaqSchema = z.object({
  q: z.string(),
  a: z.string(),
});

export const RecipeRewriteSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(20).max(500),
  ingredients: z.array(IngredientSchema).min(1).max(40),
  instructions: z.array(InstructionSchema).min(1).max(30),
  category_slug: z.enum(['ciasta', 'desery', 'obiady', 'zupy', 'salatki', 'sniadania', 'przekaski', 'napoje', 'przetwory', 'dla-dzieci']),
  cuisine_slug: z.enum(['polska', 'wloska', 'francuska', 'azjatycka', 'grecka', 'hiszpanska', 'meksykanska', 'bliskowschodnia', 'amerykanska', 'angielska', 'niemiecka', 'miedzynarodowa']).nullable(),
  diet_tags: z.array(z.enum(['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'low-carb', 'sugar-free', 'high-protein', 'low-calorie', 'paleo', 'raw'])).max(8),
  tags: z.array(z.string()).min(1).max(10),
  occasion_tags: z.array(z.string()).max(8).optional(),
  difficulty: z.enum(['łatwy', 'średni', 'trudny']),
  prep_time: z.number().int().min(0).max(600),
  cook_time: z.number().int().min(0).max(600),
  servings: z.number().int().min(1).max(50),
  notes: z.string().nullable().optional(),
  variants: z.array(z.string()).max(6).optional(),
  equipment: z.array(z.string()).max(10).optional(),
  meta_title: z.string().max(70),
  meta_description: z.string().min(80).max(180),
  faq: z.array(FaqSchema).max(5).optional(),
  image_search_query: z.string().min(3).max(120),
  image_dalle_prompt: z.string().min(20).max(500),
});

export type RecipeRewrite = z.infer<typeof RecipeRewriteSchema>;
