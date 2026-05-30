export const DataSourcesFooter = () => {
  return (
    <footer className="mt-8 border-t border-slate-800/60 pt-6 text-xs leading-relaxed text-slate-600">
      <p>
        Live hazard data:{" "}
        <a
          href="https://www.gdacs.org/"
          className="text-teal-500/90 hover:text-teal-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          GDACS
        </a>{" "}
        and{" "}
        <a
          href="https://eonet.gsfc.nasa.gov/"
          className="text-teal-500/90 hover:text-teal-400"
          target="_blank"
          rel="noopener noreferrer"
        >
          NASA EONET
        </a>
        . Historical GDACS events are cached locally for India (2000–present). Map
        panning is restricted to India bounds. Times shown in IST where applicable.
      </p>
    </footer>
  );
};
