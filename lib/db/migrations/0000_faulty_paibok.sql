CREATE TYPE "public"."difficulty" AS ENUM('łatwy', 'średni', 'trudny');--> statement-breakpoint
CREATE TYPE "public"."recipe_source" AS ENUM('telegram', 'admin-url', 'admin-photo', 'admin-manual', 'batch-import', 'seed');--> statement-breakpoint
CREATE TYPE "public"."recipe_status" AS ENUM('draft', 'review', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "activity_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"actor" varchar(255) NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity" varchar(50),
	"entity_id" varchar(100),
	"metadata" jsonb,
	"ip" varchar(50),
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"email" varchar(255) PRIMARY KEY NOT NULL,
	"role" varchar(20) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(100) NOT NULL,
	"role" varchar(100) NOT NULL,
	"bio" text NOT NULL,
	"bio_short" varchar(200) NOT NULL,
	"photo_url" text,
	"specialty" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"expertise_years" integer,
	"social_links" jsonb,
	"email" varchar(255),
	"is_active" boolean DEFAULT true NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authors_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name_pl" varchar(100) NOT NULL,
	"description" text,
	"hero_image" text,
	"parent_slug" varchar(100),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"meta_title" varchar(100),
	"meta_description" varchar(200),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "cuisines" (
	"slug" varchar(100) PRIMARY KEY NOT NULL,
	"name_pl" varchar(100) NOT NULL,
	"description" text,
	"hero_image" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diet_tags" (
	"slug" varchar(50) PRIMARY KEY NOT NULL,
	"name_pl" varchar(50) NOT NULL,
	"description" text,
	"icon" varchar(50),
	"schema_url" text,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"webp_1200x800" text,
	"webp_1200x1200" text,
	"webp_800x533" text,
	"alt" text NOT NULL,
	"caption" text,
	"source" varchar(20) NOT NULL,
	"prompt" text,
	"keywords" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"copyright" text,
	"license" varchar(50),
	"width" integer,
	"height" integer,
	"bytes" integer,
	"recipe_id" integer,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"type" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"retries" integer DEFAULT 0 NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"source_chat_id" varchar(50),
	"source_user_id" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "recipe_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"author_name" varchar(100) NOT NULL,
	"author_email" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"verification_token" varchar(64),
	"ip_hash" varchar(64) NOT NULL,
	"user_agent" text,
	"is_approved" boolean DEFAULT false NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"helpful_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"hero_image_url" text NOT NULL,
	"hero_image_alt" text NOT NULL,
	"square_image_url" text,
	"og_image_url" text,
	"prep_time" integer,
	"cook_time" integer,
	"total_time" integer,
	"servings" integer DEFAULT 1 NOT NULL,
	"difficulty" "difficulty",
	"ingredients" jsonb NOT NULL,
	"instructions" jsonb NOT NULL,
	"notes" text,
	"variants" jsonb,
	"equipment" jsonb,
	"nutrition" jsonb,
	"category_slug" varchar(100) NOT NULL,
	"cuisine_slug" varchar(100),
	"diet_tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"occasion_tags" text[] DEFAULT ARRAY[]::text[] NOT NULL,
	"author_id" integer NOT NULL,
	"source" "recipe_source" NOT NULL,
	"source_url" text,
	"source_chat_id" varchar(50),
	"source_user_id" varchar(50),
	"job_id" varchar(100),
	"meta_title" varchar(100),
	"meta_description" varchar(200),
	"faq" jsonb,
	"status" "recipe_status" DEFAULT 'draft' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_news" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"rating_avg" integer,
	"rating_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "recipes_job_id_unique" UNIQUE("job_id")
);
--> statement-breakpoint
CREATE TABLE "telegram_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"chat_id" bigint NOT NULL,
	"username" varchar(255),
	"submission_type" varchar(20) NOT NULL,
	"submission_content" text,
	"attachments" jsonb,
	"ingredients_text" text,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"recipe_id" integer,
	"error_message" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "telegram_updates" (
	"update_id" bigint PRIMARY KEY NOT NULL,
	"chat_id" bigint,
	"user_id" bigint,
	"update_type" varchar(32),
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "telegram_user_preferences" (
	"chat_id" bigint PRIMARY KEY NOT NULL,
	"default_author_id" integer,
	"default_category" varchar(100),
	"auto_publish" boolean DEFAULT false NOT NULL,
	"generate_image" boolean DEFAULT true NOT NULL,
	"image_source" varchar(20) DEFAULT 'mixed' NOT NULL,
	"estimate_nutrition" boolean DEFAULT true NOT NULL,
	"preferred_difficulty" "difficulty"
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_ratings" ADD CONSTRAINT "recipe_ratings_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_submissions" ADD CONSTRAINT "telegram_submissions_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "telegram_user_preferences" ADD CONSTRAINT "telegram_user_preferences_default_author_id_authors_id_fk" FOREIGN KEY ("default_author_id") REFERENCES "public"."authors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_actor_idx" ON "activity_logs" USING btree ("actor","created_at");--> statement-breakpoint
CREATE INDEX "activity_entity_idx" ON "activity_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status","priority");--> statement-breakpoint
CREATE INDEX "jobs_created_idx" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ratings_recipe_idx" ON "recipe_ratings" USING btree ("recipe_id","is_approved");--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_ip_recipe_unique" ON "recipe_ratings" USING btree ("recipe_id","ip_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "recipes_slug_idx" ON "recipes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "recipes_category_idx" ON "recipes" USING btree ("category_slug","status");--> statement-breakpoint
CREATE INDEX "recipes_cuisine_idx" ON "recipes" USING btree ("cuisine_slug","status");--> statement-breakpoint
CREATE INDEX "recipes_published_idx" ON "recipes" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "recipes_author_idx" ON "recipes" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "recipes_status_idx" ON "recipes" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recipes_featured_idx" ON "recipes" USING btree ("is_featured","status");