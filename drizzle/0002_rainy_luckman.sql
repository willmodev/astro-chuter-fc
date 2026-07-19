CREATE TYPE "public"."kit" AS ENUM('AZUL', 'ORO');--> statement-breakpoint
CREATE TABLE "uniformes" (
	"id" serial PRIMARY KEY NOT NULL,
	"alumno_id" integer NOT NULL,
	"kit" "kit" NOT NULL,
	"entregado" boolean DEFAULT false NOT NULL,
	"numero" integer,
	"talla" text DEFAULT '' NOT NULL,
	"abonado_cop" integer DEFAULT 0 NOT NULL,
	"registrado_por" text,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	"actualizado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uniformes_alumno_id_kit_unique" UNIQUE("alumno_id","kit")
);
--> statement-breakpoint
ALTER TABLE "uniformes" ADD CONSTRAINT "uniformes_alumno_id_alumnos_id_fk" FOREIGN KEY ("alumno_id") REFERENCES "public"."alumnos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uniformes" ADD CONSTRAINT "uniformes_registrado_por_user_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;