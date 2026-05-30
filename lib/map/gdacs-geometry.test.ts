import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { FeatureCollection } from "geojson";

import { extractAffectedAreaPolygons } from "@/lib/map/gdacs-geometry";

describe("extractAffectedAreaPolygons", () => {
  it("prefers affected area polygons over global area and centroid", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { polygonlabel: "Centroid" },
          geometry: { type: "Point", coordinates: [1, 2] },
        },
        {
          type: "Feature",
          properties: { polygonlabel: "Global area" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          },
        },
        {
          type: "Feature",
          properties: { polygonlabel: "Affected area" },
          geometry: {
            type: "MultiPolygon",
            coordinates: [
              [
                [
                  [0, 0],
                  [2, 0],
                  [2, 2],
                  [0, 0],
                ],
              ],
            ],
          },
        },
      ],
    };

    const result = extractAffectedAreaPolygons(collection);
    assert.equal(result.features.length, 1);
    assert.equal(
      (result.features[0].properties as { polygonlabel: string }).polygonlabel,
      "Affected area",
    );
  });

  it("falls back to non-centroid area features when affected area is missing", () => {
    const collection: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { polygonlabel: "Centroid" },
          geometry: { type: "Point", coordinates: [1, 2] },
        },
        {
          type: "Feature",
          properties: { polygonlabel: "Global area" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          },
        },
      ],
    };

    const result = extractAffectedAreaPolygons(collection);
    assert.equal(result.features.length, 1);
    assert.equal(result.features[0].geometry?.type, "Polygon");
  });
});
