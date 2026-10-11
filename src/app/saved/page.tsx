import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { SavedList } from "@/components/saved/saved-list";

export const metadata: Metadata = { title: "Saved" };

export default function SavedPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 pb-12 sm:px-6">
      <PageHeader
        eyebrow="Saved"
        title="Your plans"
        description="Events you've hearted, by day. Add them to your calendar in one tap."
      />
      <SavedList />
    </main>
  );
}
