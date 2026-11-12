/**
 * Server actions for the lead detail page (plan U19).
 *
 * Owner can update status + self-attributed value (R21). RLS enforces tenant
 * scoping; Supabase rejects updates to leads the owner doesn't own.
 */
"use server";

import { revalidatePath } from "next/cache";

import { getSupabase } from "../../../../lib/supabase/server";

export type StatusInput = "new" | "contacted" | "booked" | "lost" | "spam";

const STATUSES: ReadonlySet<StatusInput> = new Set([
  "new",
  "contacted",
  "booked",
  "lost",
  "spam",
]);

export async function updateLeadStatus(formData: FormData): Promise<void> {
  const leadId = String(formData.get("lead_id") ?? "");
  const status = String(formData.get("status") ?? "") as StatusInput;
  const attributedRaw = formData.get("attributed_value_usd");
  if (!leadId || !STATUSES.has(status)) {
    throw new Error("invalid_input");
  }
  const attributed_value_usd =
    status === "booked" && attributedRaw !== null && String(attributedRaw).trim() !== ""
      ? Number(attributedRaw)
      : null;

  const supabase = await getSupabase();
  const { error } = await supabase
    .from("leads")
    .update({ status, attributed_value_usd })
    .eq("id", leadId);
  if (error) {
    throw new Error(`update_failed: ${error.message}`);
  }
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}
