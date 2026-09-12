import test from "node:test";
import assert from "node:assert/strict";
import { defaultPreferences, validatePreferences } from "./managedBotInput.js";

test("accepts valid presence including disabled and invisible", () => {
  assert.deepEqual(validatePreferences(defaultPreferences), defaultPreferences);
  assert.deepEqual(validatePreferences({ ...defaultPreferences, enabled: false, status: "invisible", activity: " Test " }), { ...defaultPreferences, enabled: false, status: "invisible", activity: "Test" });
});
test("rejects malformed presence rather than coercing caller input", () => {
  for (const input of [null, {}, { ...defaultPreferences, enabled: "true" }, { ...defaultPreferences, status: "offline" }, { ...defaultPreferences, activity: "a".repeat(129) }, { ...defaultPreferences, activityType: "0" }, { ...defaultPreferences, activityType: 1 }]) {
    assert.equal(validatePreferences(input), null);
  }
});
