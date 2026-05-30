const TopBar = () => {
  return (
    <header
      role="banner"
      className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-black/95"
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <p className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Disaster Management System
        </p>
      </div>
    </header>
  );
};

export default TopBar;
