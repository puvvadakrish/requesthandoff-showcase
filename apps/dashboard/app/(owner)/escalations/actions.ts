"use server";

import { revalidatePath } from "next/cache";

import { getSupabase } from "../../../lib/supabase/server";

export async function markFalsePositive(formData: FormData): Promise<void> {
  const escalationId = String(formData.get("escalation_id") ?? "");
  if (!escalationId) {
    throw new Error("missing_escalation_id");
  }
  const supabase = await getSupabase();
  const { error } = await supabase
    .from("escalations")
    .update({
      owner_marked_false_positive: true,
      owner_feedback_at: new Date().toISOString(),
    })
    .eq("id", escalationId);
  if (error) {
    throw new Error(`update_failed: ${error.message}`);
  }
  revalidatePath("/escalations");
}
