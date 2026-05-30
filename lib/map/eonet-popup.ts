import type { Feature, Geometry } from "geojson";

import {
  decodeHtmlEntities,
  type EonetEventProperties,
} from "@/lib/map/eonet";

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const formatDate = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
};

export const buildEonetPopupHtml = (
  feature: Feature<Geometry, EonetEventProperties>,
): string => {
  const props = feature.properties;
  if (!props) {
    return "<p>Event details unavailable</p>";
  }

  const category = props.categories?.[0]?.title ?? "Event";
  const title = escapeHtml(props.title ?? "Unknown event");
  const date = props.date ? formatDate(props.date) : "—";
  const eonetLink = props.link
    ? `<a href="${escapeHtml(props.link)}" target="_blank" rel="noopener noreferrer">NASA EONET</a>`
    : "";
  const source = props.sources?.[0];
  const sourceLink = source?.url
    ? `<a href="${escapeHtml(decodeHtmlEntities(source.url))}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.id)}</a>`
    : "";

  const magnitude =
    props.magnitudeValue != null && props.magnitudeUnit
      ? `<p class="mt-1 text-xs"><strong>Magnitude:</strong> ${escapeHtml(String(props.magnitudeValue))} ${escapeHtml(props.magnitudeUnit)}</p>`
      : "";

  const links = [eonetLink, sourceLink].filter(Boolean).join(" · ");

  return `
    <div class="min-w-[10rem] max-w-[14rem] text-sm leading-snug text-zinc-900">
      <p class="text-xs font-medium uppercase tracking-wide text-zinc-500">${escapeHtml(category)}</p>
      <p class="mt-1 font-semibold">${title}</p>
      <p class="mt-1 text-xs text-zinc-600"><strong>Reported:</strong> ${escapeHtml(date)}</p>
      ${magnitude}
      ${links ? `<p class="mt-2 text-xs">${links}</p>` : ""}
    </div>
  `;
};
