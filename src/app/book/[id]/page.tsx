"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { STEPS } from "@/lib/steps";
import { useBook } from "@/lib/store";

/** /book/:id → jump to the first unfinished step. */
export default function BookIndex() {
  const { id } = useParams<{ id: string }>();
  const { book } = useBook(id);
  const router = useRouter();
  useEffect(() => {
    if (!book) return;
    const next = STEPS.find((s) => !book.completed.includes(s.id) && !s.locked?.(book)) ?? STEPS[0];
    router.replace(`/book/${id}/${next.id}`);
  }, [book, id, router]);
  return null;
}
