import assert from "node:assert/strict";
import { test } from "node:test";
import { rankReels, type ReelCandidate } from "./rank-reels";

const window = { since: "2026-08-19", until: "2026-11-16" };
const reel = (permalink: string, postedOn: string, views: number): ReelCandidate => ({ permalink, postedOn, views });

test("ranks the current 90 days by total views and holds back reels under two weeks", () => {
  const ranked = rankReels(
    [
      reel("https://www.instagram.com/reel/mature-a/", "2026-09-01", 40_000),
      reel("https://www.instagram.com/reel/mature-b/", "2026-10-01", 25_000),
      reel("https://www.instagram.com/reel/mature-c/", "2026-10-20", 12_000),
      reel("https://www.instagram.com/reel/too-new/", "2026-11-10", 11_000),
      reel("https://www.instagram.com/reel/outside/", "2026-08-01", 99_000),
    ],
    window,
  );
  assert.deepEqual(
    ranked.map((item) => item.permalink),
    [
      "https://www.instagram.com/reel/mature-a/",
      "https://www.instagram.com/reel/mature-b/",
      "https://www.instagram.com/reel/mature-c/",
    ],
  );
});

test("a newer reel is included only when it already beats the established top reels", () => {
  const ranked = rankReels(
    [
      reel("https://www.instagram.com/reel/mature-a/", "2026-09-01", 40_000),
      reel("https://www.instagram.com/reel/mature-b/", "2026-10-01", 25_000),
      reel("https://www.instagram.com/reel/mature-c/", "2026-10-20", 12_000),
      reel("https://www.instagram.com/reel/breakout/", "2026-11-12", 30_000),
    ],
    window,
  );
  assert.deepEqual(
    ranked.map((item) => [item.permalink.split("/reel/")[1], item.views]),
    [
      ["mature-a/", 40_000],
      ["breakout/", 30_000],
      ["mature-b/", 25_000],
    ],
  );
});

test("a reel posted exactly two weeks before the window ends is old enough", () => {
  const ranked = rankReels([reel("https://www.instagram.com/reel/edge/", "2026-11-02", 5_000)], window);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].postedOn, "2026-11-02");
});
