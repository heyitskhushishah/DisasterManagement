const CHECKLIST_ITEMS = [
  {
    title: "Confirm your assignment",
    detail: "Verify role and organization with your coordinator before deploying.",
  },
  {
    title: "Review map markers",
    detail: "Cross-check live GDACS alerts and NASA EONET events near your AO.",
  },
  {
    title: "Update emergency contact",
    detail: "Ensure your profile emergency contact is current for field ops.",
  },
  {
    title: "Log equipment & PPE",
    detail: "Document issued gear with your team lead before entering affected areas.",
  },
] as const;

const RESOURCE_LINKS = [
  {
    label: "GDACS",
    href: "https://www.gdacs.org/",
    description: "Global disaster alerts",
  },
  {
    label: "NASA EONET",
    href: "https://eonet.gsfc.nasa.gov/",
    description: "Open natural events",
  },
  {
    label: "NDMA India",
    href: "https://ndma.gov.in/",
    description: "National guidelines",
  },
] as const;

export const ResponseChecklist = () => {
  return (
    <section
      className="dashboard-panel rounded-xl border border-slate-800/80 p-4"
      aria-label="Field response checklist"
    >
      <h2 className="text-sm font-semibold text-slate-200">Response checklist</h2>
      <p className="mt-0.5 text-xs text-slate-500">Pre-deployment reminders</p>

      <ol className="mt-4 space-y-3">
        {CHECKLIST_ITEMS.map((item, index) => (
          <li key={item.title} className="flex gap-3">
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800/80 font-mono text-[11px] text-teal-400"
              aria-hidden
            >
              {index + 1}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-200">{item.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                {item.detail}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-5 border-t border-slate-800/80 pt-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
          External resources
        </p>
        <ul className="mt-2 space-y-2">
          {RESOURCE_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-baseline justify-between gap-2 text-sm text-teal-400 hover:text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
              >
                <span className="font-medium">{link.label}</span>
                <span className="text-xs text-slate-600 group-hover:text-slate-500">
                  {link.description}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};
