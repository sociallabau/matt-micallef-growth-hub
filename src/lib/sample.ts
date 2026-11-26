import type { AirtableRecord } from "./airtable";

// Local-dev copy of the Airtable "McGrath Dashboard" + "McGrath Monthly Trend"
// tables (20 Oct 2026), used only when AIRTABLE_TOKEN isn't set. Never used in production.

const REELS = {
  jonathan: ["https://www.instagram.com/reel/Dd3FXSjjeiV/", "https://www.instagram.com/reel/DcQLyWkDIut/", "https://www.instagram.com/reel/DdVo84hiUDk/"],
  mcgrath: ["https://www.instagram.com/reel/DbaNbEDJGa4/", "https://www.instagram.com/reel/DbSe9lxJdpa/", "https://www.instagram.com/reel/DbsPO4sJvi_/"],
  fiona: ["https://www.instagram.com/reel/DcrkyyfAS56/", "https://www.instagram.com/reel/DdVq5I9D6MR/", "https://www.instagram.com/reel/DburqbxgtSJ/"],
};

const dashRow = (id: string, name: string, adId: string | null, v: number[], reels: string[]): AirtableRecord => {
  const [start, net, total, fb, ig, visits, views, inter, vB, vS, iB, iS, male, female] = v;
  return {
    id,
    fields: {
      fldkWW68ifIOCb22k: name,
      ...(adId ? { fldSsMzLaMgaKcO7t: adId } : {}),
      fldmHx8ntutWqYpUr: start,
      flddQMdBfJ0zS4vr9: net,
      fldNky6vQCcBuzalq: total,
      fldcb1q7aBIBagTgf: fb,
      fldn0wfupXO2ybtV2: ig,
      fldhPU3g1SQ6FERFZ: visits,
      flds1x83lmdgmHPOP: views,
      fldmotxsJu8ovNPTj: inter,
      fldwODlc8hLkQ0dpz: vB,
      fldfz72jBX7yjtynK: vS,
      fldftiLbqt8yASR6j: iB,
      fldaRgcAcTwlYp4Rg: iS,
      fldQJxttMxlA1HCV8: male,
      fldVi1ZIJdJeCfEdB: female,
      fldCk6CtikWJwFvQT: "2026-07-02",
      fldWJTr57LdqHGhfD: reels[0],
      fldiaiDceN1htglXK: reels[1],
      fldadAFUDA8FynAKg: reels[2],
    },
  };
};

// [month, followers, views, interactions, profile visits, new follows]
type Row = [string, number, number, number, number, number];
const trendRows = (client: string, rows: Row[]): AirtableRecord[] =>
  rows.map(([m, followers, views, inter, visits, follows]) => ({
    id: `${client}-${m}`,
    fields: {
      fldMyuPbYBrBf8oQS: [{ id: client }],
      fldEjSVSfIFs2ofhk: `${m}-01`,
      fldcMv7W3SEaH92fB: { name: m < "2026-07" ? "Before onboarding" : "Since onboarding" },
      fldxgOfT3IS1p1xMr: followers,
      fldN4VynJsvJnJGnw: views,
      fldN2Z3jPnJMHms9A: inter,
      fldhiC6TSLyfXm7Bn: visits,
      fldTTUf1WSutKgtTf: follows,
    },
  }));

export function sampleRecords() {
  return {
    dash: [
      dashRow("reccZCrOJ40czsUwG", "Jonathan Koleszar - McGrath Redcliffe", null, [907, 124, 1031, 147, 884, 1661, 290100, 14669, 51585, 29058, 1424, 1298, 50, 50], REELS.jonathan),
      dashRow("recRyZv6iVuo1vdya", "McGrath Redcliffe", "2256503825098367", [95, 492, 587, 24, 563, 5922, 188344, 5125, 85, 45413, 4, 1355, 53, 47], REELS.mcgrath),
      dashRow("recKZkXLsh7jwtajh", "Fiona Cardow Moraes - McGrath Redcliffe", "4436408956621815", [286, 49, 335, 81, 254, 1508, 179771, 3518, 2896, 47904, 115, 1062, 29, 71], REELS.fiona),
    ],
    trend: [
      ...trendRows("reccZCrOJ40czsUwG", [
        ["2026-04", 842, 17696, 332, 485, 35], ["2026-05", 875, 12714, 438, 742, 50], ["2026-06", 907, 124346, 3502, 569, 53],
        ["2026-07", 957, 44698, 1564, 473, 63], ["2026-08", 985, 22160, 1038, 613, 57], ["2026-09", 1010, 20317, 1293, 446, 40], ["2026-10", 1031, 195249, 10774, 599, 30],
      ]),
      ...trendRows("recRyZv6iVuo1vdya", [
        ["2026-04", 1, 0, 0, 0, 0], ["2026-05", 40, 114, 2, 74, 39], ["2026-06", 89, 140, 10, 147, 49],
        ["2026-07", 147, 11736, 450, 282, 59], ["2026-08", 364, 60554, 1337, 2310, 234], ["2026-09", 546, 63949, 2279, 1875, 188], ["2026-10", 587, 52105, 1059, 1455, 48],
      ]),
      ...trendRows("recKZkXLsh7jwtajh", [
        ["2026-04", 266, 1082, 71, 116, 86], ["2026-05", 273, 3115, 96, 98, 11], ["2026-06", 285, 4491, 178, 108, 12],
        ["2026-07", 301, 124442, 2291, 360, 18], ["2026-08", 306, 8745, 520, 210, 10], ["2026-09", 315, 10525, 376, 270, 10], ["2026-10", 335, 36059, 331, 668, 22],
      ]),
    ],
  };
}
