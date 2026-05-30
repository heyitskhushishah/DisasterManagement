import { Suspense } from "react";
import ReliefWorkerLogin from "@/components/ReliefWorkerLogin";

export default function LoginPage() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-black">
      <Suspense fallback={<div className="min-h-screen bg-slate-950" aria-hidden />}>
        <ReliefWorkerLogin />
      </Suspense>
    </div>
  );
}
