import { R2 } from "@convex-dev/r2";
import type { DataModel } from "./_generated/dataModel";
import { components } from "./_generated/api";
import { requireDashboardAdmin } from "./dashboardAuth";

const r2 = new R2(components.r2);

export const {
  generateUploadUrl,
  syncMetadata,
  getMetadata,
  listMetadata,
  deleteObject,
} = r2.clientApi<DataModel>({
  checkUpload: async (ctx, _bucket) => {
    await requireDashboardAdmin(ctx);
  },
  checkReadBucket: async (ctx, _bucket) => {
    await requireDashboardAdmin(ctx);
  },
  checkDelete: async (ctx, _bucket, _key) => {
    await requireDashboardAdmin(ctx);
  },
});

