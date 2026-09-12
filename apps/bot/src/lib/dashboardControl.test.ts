import test from "node:test";
import assert from "node:assert/strict";
import { PermissionFlagsBits, type Guild } from "discord.js";
import { client } from "../client.js";
import { moderateFromDashboard } from "./dashboardControl.js";

const guildId = "111111111111111111";
const targetId = "222222222222222222";
const valid = { action: "TIMEOUT", targetId, reason: "Test", minutes: 10 };

test("rejects malformed commands before touching Discord", async () => {
  for (const data of [null, {}, { ...valid, action: "DELETE" }, { ...valid, targetId: "bad" },
    { ...valid, reason: " " }, { ...valid, reason: "a".repeat(401) },
    ...[0, -1, 40321, 1.5, "10", null].map((minutes) => ({ ...valid, minutes }))]) {
    assert.equal((await moderateFromDashboard(guildId, data)).ok, false);
  }
});

test("refuses commands while disconnected", async () => {
  assert.equal((await moderateFromDashboard(guildId, valid)).ok, false);
});

test("protects the owner, missing permissions, bots and role hierarchy", async (t) => {
  t.mock.method(client, "isReady", () => true);
  let permission = false;
  let bot = false;
  let hierarchy = -1;
  let permissionChecked: bigint | undefined;
  const guild = {
    ownerId: "333333333333333333",
    members: {
      fetchMe: async () => ({ permissions: { has: (value: bigint) => { permissionChecked = value; return permission; } }, roles: { highest: { comparePositionTo: () => hierarchy } } }),
      fetch: async () => ({ user: { bot, tag: "target" }, roles: { highest: {} }, moderatable: false }),
    },
  };
  client.guilds.cache.set(guildId, guild as unknown as Guild);
  try {
    assert.match((await moderateFromDashboard(guildId, { ...valid, targetId: guild.ownerId })).error!, /protégée/);
    assert.match((await moderateFromDashboard(guildId, valid)).error!, /permission/);
    assert.equal(permissionChecked, PermissionFlagsBits.ModerateMembers);
    permission = true;
    assert.match((await moderateFromDashboard(guildId, valid)).error!, /rôle supérieur/);
    hierarchy = 1; bot = true;
    assert.equal((await moderateFromDashboard(guildId, valid)).ok, false);
    bot = false;
    assert.match((await moderateFromDashboard(guildId, valid)).error!, /exclu temporairement/);
  } finally { client.guilds.cache.delete(guildId); }
});
