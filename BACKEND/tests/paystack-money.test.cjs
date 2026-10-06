const assert = require("node:assert/strict");
const test = require("node:test");
const { creatorShareKobo, formatNairaFromKobo, parseNairaToKobo, validatePaystackConfig } = require("../dist/paystack-config.js");

const testSecret = `sk_test_${"a".repeat(24)}`;
const testPublic = `pk_test_${"b".repeat(24)}`;
const liveSecret = `sk_live_${"c".repeat(24)}`;
const livePublic = `pk_live_${"d".repeat(24)}`;

test("Paystack test and production keys require valid matching modes", () => {
  assert.equal(validatePaystackConfig({ NODE_ENV: "development", PAYSTACK_SECRET_KEY: testSecret, PAYSTACK_PUBLIC_KEY: testPublic }).mode, "test");
  assert.equal(validatePaystackConfig({ NODE_ENV: "production", PAYSTACK_SECRET_KEY: liveSecret, PAYSTACK_PUBLIC_KEY: livePublic }).mode, "live");
  for (const env of [
    {},
    { NODE_ENV: "development", PAYSTACK_SECRET_KEY: liveSecret, PAYSTACK_PUBLIC_KEY: livePublic },
    { NODE_ENV: "production", PAYSTACK_SECRET_KEY: testSecret, PAYSTACK_PUBLIC_KEY: testPublic },
    { NODE_ENV: "production", PAYSTACK_SECRET_KEY: liveSecret, PAYSTACK_PUBLIC_KEY: testPublic },
    { NODE_ENV: "production", PAYSTACK_SECRET_KEY: "sk_live_bad!", PAYSTACK_PUBLIC_KEY: livePublic },
  ]) assert.throws(() => validatePaystackConfig(env));
});

test("NGN amounts parse to integer kobo without floating point", () => {
  for (const [naira, kobo] of [[200, 20_000], [500, 50_000], [1000, 100_000], [2500, 250_000], [9999, 999_900], [10_000, 1_000_000], [10_001, 1_000_100], [250_000, 25_000_000], [1_000_000, 100_000_000]]) {
    assert.equal(parseNairaToKobo(naira), BigInt(kobo));
  }
  assert.equal(parseNairaToKobo("9999.99"), 999_999n);
  assert.equal(parseNairaToKobo("1.001"), null);
  assert.equal(parseNairaToKobo("0"), null);
  assert.equal(parseNairaToKobo("30000000", 100_000_000), 3_000_000_000n);
});

test("creator share uses exact 70 percent integer floor and platform remainder", () => {
  for (const naira of [200n, 500n, 1_000n, 2_500n, 9_999n, 10_000n, 10_001n, 250_000n, 1_000_000n]) {
    const total = naira * 100n;
    const creator = creatorShareKobo(total);
    const platform = total - creator;
    assert.equal(creator, (total * 70n) / 100n);
    assert.equal(creator + platform, total);
    assert.equal(formatNairaFromKobo(total), `${naira}.00`);
  }
  assert.equal(creatorShareKobo(9_999n), 6_999n);
  assert.equal(9_999n - creatorShareKobo(9_999n), 3_000n);
  const overInt = 3_000_000_000n;
  assert.equal(creatorShareKobo(overInt), 2_100_000_000n);
  assert.equal(overInt - creatorShareKobo(overInt), 900_000_000n);
});
