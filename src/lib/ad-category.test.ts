import assert from "node:assert/strict";
import { test } from "node:test";
import { categorize, type AdAccountRules } from "./ad-category";

const sproule: AdAccountRules = {
  cmaCampaignIds: ["120226854764190600"],
  soldAsCma: true,
};

const SOLD = [
  "Sold - 23 Ridgeway Street, Tweed Heads South",
  "Sold - 2 Navigators Way, Tweed Heads",
  "Sold - 1/50 Inlet Drive, Tweed Heads West",
  "Just Sold - 4 Bay Street, Tweed Heads",
];

test("without account rules, Sold campaigns are VPA and name patterns pick CMA", () => {
  for (const name of SOLD) assert.equal(categorize(name), "VPA", name);
  assert.equal(categorize("CMA $15/day"), "CMA");
  assert.equal(categorize("Home valuation"), "CMA");
  assert.equal(categorize("Market Report March"), "CMA");
  assert.equal(categorize('Instagram post: "7 Jefferson Lane, Redcliffe"'), "Boost");
  assert.equal(categorize("VPA - 10 Anzac Avenue, Redcliffe"), "VPA");
});

test("Sproule Sold campaigns are CMA and are not also VPA", () => {
  for (const name of SOLD) {
    assert.equal(categorize(name, { rules: sproule }), "CMA", name);
    assert.notEqual(categorize(name, { rules: sproule }), "VPA");
  }
  assert.equal(categorize("Just listed - 9 Ocean Road, Tweed Heads", { rules: sproule }), "VPA");
  assert.equal(categorize('Instagram post: "Sold - 5 Queen Street"', { rules: sproule }), "Boost");
});

test("Sproule CMA is the configured campaign id, not a fuzzy name match", () => {
  assert.equal(categorize("Lead campaign", { id: "120226854764190600", rules: sproule }), "CMA");
  assert.equal(categorize("CMA $15/day", { id: "120226854764190600", rules: sproule }), "CMA");
  assert.equal(categorize("CMA $15/day", { id: "999", rules: sproule }), "Other");
  assert.equal(categorize("Home valuation", { rules: sproule }), "Other");
  assert.equal(categorize("Market Report March", { rules: sproule }), "Other");
});
