import { fetchGdacsIndiaEvents } from "@/lib/gdacs/fetchGdacsIndiaEvents";

type CliOptions = {
  startDate?: string;
  endDate?: string;
  outputPath?: string;
};

const parseCliArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {};

  for (const arg of argv) {
    if (arg.startsWith("--startDate=")) {
      options.startDate = arg.slice("--startDate=".length);
      continue;
    }

    if (arg.startsWith("--endDate=")) {
      options.endDate = arg.slice("--endDate=".length);
      continue;
    }

    if (arg.startsWith("--output=")) {
      options.outputPath = arg.slice("--output=".length);
    }
  }

  return options;
};

const main = async (): Promise<void> => {
  const options = parseCliArgs(process.argv.slice(2));
  const collection = await fetchGdacsIndiaEvents(options);

  if (!options.outputPath) {
    console.log(
      `[GDACS] Done. ${collection.features.length} deduplicated India features (use --output= to save GeoJSON).`,
    );
  }
};

main().catch((error: unknown) => {
  console.error("[GDACS] Fetch failed:", error);
  process.exitCode = 1;
});
