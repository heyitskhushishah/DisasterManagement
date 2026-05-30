import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { Feature } from "geojson";

import { dedupeGdacsFeatures } from "@/lib/gdacs/dedupeGdacsFeatures";
import { isIndiaGdacsFeature } from "@/lib/gdacs/isIndiaGdacsFeature";

const makeFeature = (
  properties: Record<string, unknown>,
): Feature => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [0, 0] },
  properties,
});

describe("isIndiaGdacsFeature", () => {
  it("matches direct iso3 on properties", () => {
    const feature = makeFeature({ iso3: "IND", country: "Nepal" });
    assert.equal(isIndiaGdacsFeature(feature), true);
  });

  it("matches country name on properties", () => {
    const feature = makeFeature({ country: "India", iso3: "NPL" });
    assert.equal(isIndiaGdacsFeature(feature), true);
  });

  it("matches countryname on properties", () => {
    const feature = makeFeature({ countryname: "india" });
    assert.equal(isIndiaGdacsFeature(feature), true);
  });

  it("matches affectedcountries array entries", () => {
    const feature = makeFeature({
      country: "Bangladesh",
      affectedcountries: [
        { iso3: "BGD", countryname: "Bangladesh" },
        { iso3: "IND", countryname: "India" },
      ],
    });
    assert.equal(isIndiaGdacsFeature(feature), true);
  });

  it("matches affectedcountries single object entry", () => {
    const feature = makeFeature({
      affectedcountries: { iso3: "IND", name: "India" },
    });
    assert.equal(isIndiaGdacsFeature(feature), true);
  });

  it("rejects non-India events", () => {
    const feature = makeFeature({
      iso3: "PER",
      country: "Peru",
      affectedcountries: [{ iso3: "PER", countryname: "Peru" }],
    });
    assert.equal(isIndiaGdacsFeature(feature), false);
  });
});

describe("dedupeGdacsFeatures", () => {
  it("keeps one copy per event dedupe key", () => {
    const shared = {
      eventtype: "FL",
      eventid: 42,
      episodeid: 7,
      fromdate: "2024-01-01T00:00:00",
      todate: "2024-01-10T00:00:00",
    };

    const first = makeFeature({ ...shared, country: "India", iso3: "IND" });
    const duplicate = makeFeature({
      ...shared,
      country: "India",
      iso3: "IND",
      description: "duplicate episode",
    });
    const other = makeFeature({
      eventtype: "FL",
      eventid: 43,
      episodeid: 7,
      fromdate: shared.fromdate,
      todate: shared.todate,
      country: "India",
      iso3: "IND",
    });

    const deduped = dedupeGdacsFeatures([first, duplicate, other]);

    assert.equal(deduped.length, 2);
    assert.equal(deduped[0], first);
    assert.equal(deduped[1], other);
  });
});
