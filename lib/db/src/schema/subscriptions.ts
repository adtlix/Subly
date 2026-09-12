import { createInsertSchema } from "drizzle-zod";
import { date, doublePrecision, integer, pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const subscriptionsTable = pgTable(
  "subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    plan: text("plan").notNull().default(""),
    category: text("category").notNull(),
    amount: doublePrecision("amount").notNull(),
    billingCycle: text("billing_cycle").notNull(),
    nextRenewal: date("next_renewal", { mode: "string" }).notNull(),
    noticeDays: integer("notice_days").notNull().default(30),
    lastUsed: date("last_used", { mode: "string" }).notNull(),
    status: text("status").notNull().default("active"),
    contractNumber: text("contract_number").notNull().default(""),
    color: text("color").notNull().default("#ed6a5a"),
    logoText: text("logo_text").notNull().default("S"),
    cancellationAddress: text("cancellation_address").notNull().default(""),
    hotline: text("hotline").notNull().default(""),
    priceChange: doublePrecision("price_change"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  },
  (table) => [
    index("idx_subscriptions_user_id").on(table.userId),
    index("idx_subscriptions_status").on(table.status),
    index("idx_subscriptions_next_renewal").on(table.nextRenewal),
    index("idx_subscriptions_user_status").on(table.userId, table.status),
    index("idx_subscriptions_user_renewal").on(table.userId, table.nextRenewal),
  ]
);

export const insertSubscriptionSchema = createInsertSchema(subscriptionsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptionsTable.$inferSelect;
