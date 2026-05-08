import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

export const difficultyEnum = pgEnum('difficulty', ['łatwy', 'średni', 'trudny']);

export const recipeSourceEnum = pgEnum('recipe_source', [
  'telegram',
  'admin-url',
  'admin-photo',
  'admin-manual',
  'batch-import',
  'seed',
]);

export const recipeStatusEnum = pgEnum('recipe_status', ['draft', 'review', 'published', 'archived']);

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name_pl: varchar('name_pl', { length: 100 }).notNull(),
  description: text('description'),
  hero_image: text('hero_image'),
  parent_slug: varchar('parent_slug', { length: 100 }),
  sort_order: integer('sort_order').notNull().default(0),
  meta_title: varchar('meta_title', { length: 100 }),
  meta_description: varchar('meta_description', { length: 200 }),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const cuisines = pgTable('cuisines', {
  slug: varchar('slug', { length: 100 }).primaryKey(),
  name_pl: varchar('name_pl', { length: 100 }).notNull(),
  description: text('description'),
  hero_image: text('hero_image'),
  sort_order: integer('sort_order').notNull().default(0),
});

export const dietTags = pgTable('diet_tags', {
  slug: varchar('slug', { length: 50 }).primaryKey(),
  name_pl: varchar('name_pl', { length: 50 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  schema_url: text('schema_url'),
  sort_order: integer('sort_order').notNull().default(0),
});

export const authors = pgTable('authors', {
  id: serial('id').primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  role: varchar('role', { length: 100 }).notNull(),
  bio: text('bio').notNull(),
  bio_short: varchar('bio_short', { length: 200 }).notNull(),
  photo_url: text('photo_url'),
  specialty: text('specialty').array().notNull().default(sql`ARRAY[]::text[]`),
  expertise_years: integer('expertise_years'),
  social_links: jsonb('social_links'),
  email: varchar('email', { length: 255 }),
  is_active: boolean('is_active').notNull().default(true),
  is_primary: boolean('is_primary').notNull().default(false),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const recipes = pgTable(
  'recipes',
  {
    id: serial('id').primaryKey(),
    slug: varchar('slug', { length: 255 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description').notNull(),

    hero_image_url: text('hero_image_url').notNull(),
    hero_image_alt: text('hero_image_alt').notNull(),
    square_image_url: text('square_image_url'),
    og_image_url: text('og_image_url'),

    prep_time: integer('prep_time'),
    cook_time: integer('cook_time'),
    total_time: integer('total_time'),
    servings: integer('servings').notNull().default(1),
    difficulty: difficultyEnum('difficulty'),

    ingredients: jsonb('ingredients').notNull(),
    instructions: jsonb('instructions').notNull(),
    notes: text('notes'),
    variants: jsonb('variants'),
    equipment: jsonb('equipment'),

    nutrition: jsonb('nutrition'),

    category_slug: varchar('category_slug', { length: 100 }).notNull(),
    cuisine_slug: varchar('cuisine_slug', { length: 100 }),
    diet_tags: text('diet_tags').array().notNull().default(sql`ARRAY[]::text[]`),
    tags: text('tags').array().notNull().default(sql`ARRAY[]::text[]`),
    occasion_tags: text('occasion_tags').array().notNull().default(sql`ARRAY[]::text[]`),

    author_id: integer('author_id').notNull().references(() => authors.id),

    source: recipeSourceEnum('source').notNull(),
    source_url: text('source_url'),
    source_chat_id: varchar('source_chat_id', { length: 50 }),
    source_user_id: varchar('source_user_id', { length: 50 }),
    job_id: varchar('job_id', { length: 100 }).unique(),

    meta_title: varchar('meta_title', { length: 100 }),
    meta_description: varchar('meta_description', { length: 200 }),
    faq: jsonb('faq'),

    status: recipeStatusEnum('status').notNull().default('draft'),
    is_featured: boolean('is_featured').notNull().default(false),
    is_news: boolean('is_news').notNull().default(false),

    published_at: timestamp('published_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

    view_count: integer('view_count').notNull().default(0),
    save_count: integer('save_count').notNull().default(0),
    rating_avg: integer('rating_avg'),
    rating_count: integer('rating_count').notNull().default(0),
  },
  (t) => [
    uniqueIndex('recipes_slug_idx').on(t.slug),
    index('recipes_category_idx').on(t.category_slug, t.status),
    index('recipes_cuisine_idx').on(t.cuisine_slug, t.status),
    index('recipes_published_idx').on(t.published_at),
    index('recipes_author_idx').on(t.author_id),
    index('recipes_status_idx').on(t.status),
    index('recipes_featured_idx').on(t.is_featured, t.status),
  ],
);

export const recipeRatings = pgTable(
  'recipe_ratings',
  {
    id: serial('id').primaryKey(),
    recipe_id: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    author_name: varchar('author_name', { length: 100 }).notNull(),
    author_email: varchar('author_email', { length: 255 }),
    email_verified: boolean('email_verified').notNull().default(false),
    verification_token: varchar('verification_token', { length: 64 }),
    ip_hash: varchar('ip_hash', { length: 64 }).notNull(),
    user_agent: text('user_agent'),
    is_approved: boolean('is_approved').notNull().default(false),
    is_spam: boolean('is_spam').notNull().default(false),
    helpful_count: integer('helpful_count').notNull().default(0),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('ratings_recipe_idx').on(t.recipe_id, t.is_approved),
    uniqueIndex('ratings_ip_recipe_unique').on(t.recipe_id, t.ip_hash),
  ],
);

export const jobs = pgTable(
  'jobs',
  {
    id: varchar('id', { length: 100 }).primaryKey(),
    type: varchar('type', { length: 50 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    payload: jsonb('payload').notNull(),
    result: jsonb('result'),
    error: text('error'),
    retries: integer('retries').notNull().default(0),
    max_retries: integer('max_retries').notNull().default(3),
    priority: integer('priority').notNull().default(0),
    source_chat_id: varchar('source_chat_id', { length: 50 }),
    source_user_id: varchar('source_user_id', { length: 50 }),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    started_at: timestamp('started_at', { withTimezone: true }),
    completed_at: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [index('jobs_status_idx').on(t.status, t.priority), index('jobs_created_idx').on(t.created_at)],
);

export const telegramUpdates = pgTable('telegram_updates', {
  update_id: bigint('update_id', { mode: 'bigint' }).primaryKey(),
  chat_id: bigint('chat_id', { mode: 'bigint' }),
  user_id: bigint('user_id', { mode: 'bigint' }),
  update_type: varchar('update_type', { length: 32 }),
  received_at: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
});

export const telegramSubmissions = pgTable('telegram_submissions', {
  id: serial('id').primaryKey(),
  user_id: bigint('user_id', { mode: 'bigint' }).notNull(),
  chat_id: bigint('chat_id', { mode: 'bigint' }).notNull(),
  username: varchar('username', { length: 255 }),
  submission_type: varchar('submission_type', { length: 20 }).notNull(),
  submission_content: text('submission_content'),
  attachments: jsonb('attachments'),
  ingredients_text: text('ingredients_text'),
  status: varchar('status', { length: 20 }).notNull().default('queued'),
  recipe_id: integer('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  error_message: text('error_message'),
  submitted_at: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  processed_at: timestamp('processed_at', { withTimezone: true }),
});

export const telegramUserPreferences = pgTable('telegram_user_preferences', {
  chat_id: bigint('chat_id', { mode: 'bigint' }).primaryKey(),
  default_author_id: integer('default_author_id').references(() => authors.id),
  default_category: varchar('default_category', { length: 100 }),
  auto_publish: boolean('auto_publish').notNull().default(false),
  generate_image: boolean('generate_image').notNull().default(true),
  image_source: varchar('image_source', { length: 20 }).notNull().default('mixed'),
  estimate_nutrition: boolean('estimate_nutrition').notNull().default(true),
  preferred_difficulty: difficultyEnum('preferred_difficulty'),
});

export const adminUsers = pgTable('admin_users', {
  email: varchar('email', { length: 255 }).primaryKey(),
  role: varchar('role', { length: 20 }).notNull(),
  is_active: boolean('is_active').notNull().default(true),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const activityLogs = pgTable(
  'activity_logs',
  {
    id: serial('id').primaryKey(),
    actor: varchar('actor', { length: 255 }).notNull(),
    action: varchar('action', { length: 100 }).notNull(),
    entity: varchar('entity', { length: 50 }),
    entity_id: varchar('entity_id', { length: 100 }),
    metadata: jsonb('metadata'),
    ip: varchar('ip', { length: 50 }),
    user_agent: text('user_agent'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('activity_actor_idx').on(t.actor, t.created_at),
    index('activity_entity_idx').on(t.entity, t.entity_id),
  ],
);

export const images = pgTable('images', {
  id: serial('id').primaryKey(),
  url: text('url').notNull(),
  thumbnail_url: text('thumbnail_url'),
  webp_1200x800: text('webp_1200x800'),
  webp_1200x1200: text('webp_1200x1200'),
  webp_800x533: text('webp_800x533'),
  alt: text('alt').notNull(),
  caption: text('caption'),
  source: varchar('source', { length: 20 }).notNull(),
  prompt: text('prompt'),
  keywords: text('keywords').array().notNull().default(sql`ARRAY[]::text[]`),
  copyright: text('copyright'),
  license: varchar('license', { length: 50 }),
  width: integer('width'),
  height: integer('height'),
  bytes: integer('bytes'),
  recipe_id: integer('recipe_id').references(() => recipes.id, { onDelete: 'set null' }),
  usage_count: integer('usage_count').notNull().default(0),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// TS types
export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
export type Author = typeof authors.$inferSelect;
export type NewAuthor = typeof authors.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type DietTag = typeof dietTags.$inferSelect;
export type Cuisine = typeof cuisines.$inferSelect;
export type RecipeRating = typeof recipeRatings.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;

// Domain JSONB types
export type Ingredient = {
  raw: string;
  amount: number | null;
  unit: string | null;
  name: string;
  optional?: boolean;
  group?: string;
};

export type Instruction = {
  step: number;
  text: string;
  image_url?: string;
  image_alt?: string;
  tip?: string;
  duration_minutes?: number;
  temperature_c?: number;
};

export type Nutrition = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g?: number;
  sugar_g?: number;
  sodium_mg?: number;
  saturated_fat_g?: number;
  per_100g?: { kcal: number; protein_g: number; carbs_g: number; fat_g: number };
  source: 'gpt-estimated' | 'usda-lookup' | 'manual';
  confidence: 'low' | 'medium' | 'high';
  generated_at: string;
};

export type FaqItem = { q: string; a: string };
