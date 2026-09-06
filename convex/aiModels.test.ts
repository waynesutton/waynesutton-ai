/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import { AI_MODEL_SLOTS, isValidModelId } from "./lib/aiModelSlots";
const modules = import.meta.glob("./**/*.ts");

async function adminClient() {
  const t = convexTest(schema, modules);
  await t.run((ctx) =>
    ctx.db.insert("dashboardAdmins", { subject: "test-admin", createdAt: 1 }),
  );
  return { t, admin: t.withIdentity({ subject: "test-admin" }) };
}

test("model ids must be a single token", () => {
  expect(isValidModelId("gpt-4.1-mini")).toBe(true);
  expect(isValidModelId("anthropic/claude-sonnet-4")).toBe(true);
  expect(isValidModelId("runware:101@1")).toBe(true);
  expect(isValidModelId("")).toBe(false);
  expect(isValidModelId("gpt 4")).toBe(false);
  expect(isValidModelId("x".repeat(201))).toBe(false);
});

test("slot status lists every catalog slot with no override by default", async () => {
  const { admin } = await adminClient();
  const status = await admin.query(api.aiModels.modelSlotStatus, {});
  expect(status).toHaveLength(AI_MODEL_SLOTS.length);
  expect(status.every((slot) => slot.override === null)).toBe(true);
});

test("set, replace, and reset a model override", async () => {
  const { t, admin } = await adminClient();
  const slot = { vendor: "OPENAI_API_KEY", kind: "chat" as const };

  await admin.mutation(api.aiModels.setModelOverride, { ...slot, model: " gpt-5 " });
  let config = await t.query(internal.aiModels.providerConfig, slot);
  expect(config.modelOverride).toBe("gpt-5");

  // Replacing writes a single row, not a second one
  await admin.mutation(api.aiModels.setModelOverride, { ...slot, model: "gpt-5-mini" });
  const rows = await t.run((ctx) => ctx.db.query("aiModelOverrides").take(10));
  expect(rows).toHaveLength(1);
  expect(rows[0].model).toBe("gpt-5-mini");

  // Other kinds for the same vendor are untouched
  const tts = await t.query(internal.aiModels.providerConfig, {
    vendor: "OPENAI_API_KEY",
    kind: "tts",
  });
  expect(tts.modelOverride).toBeNull();

  await admin.mutation(api.aiModels.removeModelOverride, slot);
  config = await t.query(internal.aiModels.providerConfig, slot);
  expect(config.modelOverride).toBeNull();
  // Reset is idempotent
  await admin.mutation(api.aiModels.removeModelOverride, slot);
});

test("provider config returns the vendor key override alongside the model", async () => {
  const { t, admin } = await adminClient();
  await admin.mutation(api.pipelineKeys.setVendorKey, {
    name: "ANTHROPIC_API_KEY",
    value: "sk-test",
  });
  const config = await t.query(internal.aiModels.providerConfig, {
    vendor: "ANTHROPIC_API_KEY",
    kind: "chat",
  });
  expect(config).toEqual({ keyOverride: "sk-test", modelOverride: null });
});

test("batch vendor key lookup returns only overrides that are set", async () => {
  const { t, admin } = await adminClient();
  await admin.mutation(api.pipelineKeys.setVendorKey, {
    name: "AGENTMAIL_API_KEY",
    value: "am-test",
  });
  // Blank overrides are treated as unset
  await t.run((ctx) =>
    ctx.db.insert("vendorKeys", {
      name: "AGENTMAIL_INBOX",
      value: "   ",
      updatedAt: 1,
    }),
  );
  const values = await t.query(internal.pipelineKeys.getVendorKeyValues, {
    names: ["AGENTMAIL_API_KEY", "AGENTMAIL_INBOX", "AGENTMAIL_CONTACT_EMAIL"],
  });
  expect(values).toEqual({ AGENTMAIL_API_KEY: "am-test" });
});

test("vendor key status reports override source and whether the env var is set", async () => {
  const { admin } = await adminClient();
  await admin.mutation(api.pipelineKeys.setVendorKey, {
    name: "RUNWARE_API_KEY",
    value: "rw-test",
  });
  const status = await admin.query(api.pipelineKeys.vendorKeyStatus, {});
  const runware = status.find((entry) => entry.name === "RUNWARE_API_KEY");
  expect(runware?.configured).toBe(true);
  expect(runware?.source).toBe("override");
  expect(typeof runware?.envConfigured).toBe("boolean");
});

test("rejects unknown slots, blank ids, and ids with whitespace", async () => {
  const { admin } = await adminClient();
  await expect(
    admin.mutation(api.aiModels.setModelOverride, {
      vendor: "FIRECRAWL_API_KEY",
      kind: "chat",
      model: "x",
    }),
  ).rejects.toThrow("Unknown model slot");
  await expect(
    admin.mutation(api.aiModels.setModelOverride, {
      vendor: "OPENAI_API_KEY",
      kind: "chat",
      model: "   ",
    }),
  ).rejects.toThrow("Model id is required");
  await expect(
    admin.mutation(api.aiModels.setModelOverride, {
      vendor: "OPENAI_API_KEY",
      kind: "chat",
      model: "gpt 5",
    }),
  ).rejects.toThrow("single token");
});

test("model overrides require a dashboard admin", async () => {
  const t = convexTest(schema, modules);
  await expect(t.query(api.aiModels.modelSlotStatus, {})).rejects.toThrow();
  await expect(
    t.mutation(api.aiModels.setModelOverride, {
      vendor: "OPENAI_API_KEY",
      kind: "chat",
      model: "gpt-5",
    }),
  ).rejects.toThrow();
});
