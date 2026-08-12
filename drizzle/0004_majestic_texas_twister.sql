ALTER TABLE "pagos" DROP CONSTRAINT "pagos_alumno_id_anio_mes_unique";--> statement-breakpoint
ALTER TABLE "pagos" ADD COLUMN "anulado_en" timestamp;--> statement-breakpoint
ALTER TABLE "pagos" ADD COLUMN "anulado_por" text;--> statement-breakpoint
ALTER TABLE "pagos" ADD COLUMN "motivo_anulacion" text;--> statement-breakpoint
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_anulado_por_user_id_fk" FOREIGN KEY ("anulado_por") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pagos_alumno_anio_mes_vivo" ON "pagos" USING btree ("alumno_id","anio","mes") WHERE "pagos"."anulado_en" is null;