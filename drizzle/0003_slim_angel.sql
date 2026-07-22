CREATE TYPE "public"."dia_entreno" AS ENUM('Lunes', 'Miércoles', 'Viernes');--> statement-breakpoint
CREATE TABLE "planes_semana" (
	"id" serial PRIMARY KEY NOT NULL,
	"entrenador_id" text NOT NULL,
	"semana_inicio" date NOT NULL,
	"tema" text NOT NULL,
	"objetivos" text NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "planes_semana_entrenador_id_semana_inicio_unique" UNIQUE("entrenador_id","semana_inicio")
);
--> statement-breakpoint
CREATE TABLE "sesiones" (
	"id" serial PRIMARY KEY NOT NULL,
	"entrenador_id" text NOT NULL,
	"semana_inicio" date NOT NULL,
	"dia" "dia_entreno" NOT NULL,
	"parte_central_url" text,
	"parte_central_nota" text DEFAULT '' NOT NULL,
	"ausentes" integer[],
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sesiones_entrenador_id_semana_inicio_dia_unique" UNIQUE("entrenador_id","semana_inicio","dia")
);
--> statement-breakpoint
ALTER TABLE "planes_semana" ADD CONSTRAINT "planes_semana_entrenador_id_user_id_fk" FOREIGN KEY ("entrenador_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sesiones" ADD CONSTRAINT "sesiones_entrenador_id_user_id_fk" FOREIGN KEY ("entrenador_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;