CREATE TYPE "public"."mes" AS ENUM('ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC');--> statement-breakpoint
CREATE TABLE "alumnos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"documento" text NOT NULL,
	"anio_nacimiento" integer NOT NULL,
	"fecha_nacimiento" date,
	"acudiente" text NOT NULL,
	"celular" text NOT NULL,
	"direccion" text DEFAULT '' NOT NULL,
	"fecha_inicio" date NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "alumnos_documento_unique" UNIQUE("documento")
);
--> statement-breakpoint
CREATE TABLE "pagos" (
	"id" serial PRIMARY KEY NOT NULL,
	"alumno_id" integer NOT NULL,
	"anio" integer NOT NULL,
	"mes" "mes" NOT NULL,
	"monto_cop" integer NOT NULL,
	"metodo" text,
	"pagado_en" timestamp,
	"registrado_por" text,
	CONSTRAINT "pagos_alumno_id_anio_mes_unique" UNIQUE("alumno_id","anio","mes")
);
--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_alumno_id_alumnos_id_fk" FOREIGN KEY ("alumno_id") REFERENCES "public"."alumnos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_registrado_por_user_id_fk" FOREIGN KEY ("registrado_por") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;