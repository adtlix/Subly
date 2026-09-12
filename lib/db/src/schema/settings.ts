import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const settingsTable = pgTable(
  "user_settings",
  {
    userId: text("user_id").primaryKey().references(() => usersTable.id, { onDelete: "cascade" }),
    currency: text("currency").notNull().default("CHF"),
    noticeDays: integer("notice_days").notNull().default(30),
    twoFactorEnabled: integer("two_factor_enabled").notNull().default(1),
    updatedAt: text("updated_at").notNull(),
  }
);

export const insertSettingsSchema = createInsertSchema(settingsTable);
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type UserSettings = typeof settingsTable.$inferSelect;
