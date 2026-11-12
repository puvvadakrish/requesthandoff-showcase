/**
 * check_service_area — is the caller's location inside the tenant's coverage area? (R8, AE5)
 *
 * MVP: ZIP-code allowlist on the tenant. Empty list = no coverage check
 * (tenant accepts any caller). v1.1: drive-time radius from a service center.
 */
import { fail, ok, type ToolContext, type ToolResponse } from "./types.js";

export interface CheckServiceAreaArgs {
  zip_code?: string;
}

export interface CheckServiceAreaResult {
  in_area: boolean;
  reason: string;
}

export function checkServiceArea(
  ctx: ToolContext,
  args: CheckServiceAreaArgs,
): ToolResponse<CheckServiceAreaResult> {
  const startedAt = Date.now();
  const zip = args.zip_code?.trim() ?? "";

  // Empty coverage_zip_codes = no allowlist; accept everyone.
  if (ctx.tenant.coverage_zip_codes.length === 0) {
    return ok({ in_area: true, reason: "no_coverage_check" }, startedAt);
  }

  if (zip === "") {
    return fail("missing_zip", "ZIP code required to check coverage", startedAt);
  }

  if (!/^\d{5}$/.test(zip)) {
    return fail("invalid_zip", `invalid ZIP code: ${zip}`, startedAt);
  }

  const inArea = ctx.tenant.coverage_zip_codes.includes(zip);
  return ok(
    {
      in_area: inArea,
      reason: inArea ? "in_coverage_zip" : "out_of_coverage",
    },
    startedAt,
  );
}
