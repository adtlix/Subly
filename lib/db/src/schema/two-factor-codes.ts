import { pgTable, text, integer, bigint, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const twoFactorCodesTable = pgTable(
  "verification_codes",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    code: text("code").notNull(),
    expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
    used: integer("used").notNull().default(0),
    attempts: integer("attempts").notNull().default(0),
    createdAt: bigint("created_at", { mode: "number" }).notNull(),
  },
  (table) => [
    index("idx_verification_codes_email").on(table.email),
    index("idx_verification_codes_code").on(table.code),
    index("idx_verification_codes_expires_at").on(table.expiresAt),
  ]
);

export const insertTwoFactorCodeSchema = createInsertSchema(twoFactorCodesTable);
export type InsertTwoFactorCode = z.infer<typeof insertTwoFactorCodeSchema>;
export type TwoFactorCode = typeof twoFactorCodesTable.$inferSelect;
