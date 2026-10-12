"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Book, StepId } from "./types";

const KEY = "coauthor-proto:books";

interface Store {
  ready: boolean;
  books: Book[];
  createBook: (init: Omit<Book, "id" | "createdAt" | "updatedAt" | "completed" | "resources"> & Partial<Book>) => Book;
  updateBook: (id: string, patch: Partial<Book> | ((b: Book) => Partial<Book>)) => void;
  deleteBook: (id: string) => void;
  completeStep: (id: string, step: StepId) => void;
}

const Ctx = createContext<Store | null>(null);

export const uid = () => Math.random().toString(36).slice(2, 10);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setBooks(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(books));
  }, [books, ready]);

  const createBook: Store["createBook"] = useCallback((init) => {
    const now = Date.now();
    const book: Book = { resources: [], completed: [], ...init, id: uid(), createdAt: now, updatedAt: now };
    setBooks((bs) => [book, ...bs]);
    return book;
  }, []);

  const updateBook: Store["updateBook"] = useCallback((id, patch) => {
    setBooks((bs) =>
      bs.map((b) =>
        b.id === id ? { ...b, ...(typeof patch === "function" ? patch(b) : patch), updatedAt: Date.now() } : b,
      ),
    );
  }, []);

  const deleteBook = useCallback((id: string) => setBooks((bs) => bs.filter((b) => b.id !== id)), []);

  const completeStep = useCallback(
    (id: string, step: StepId) =>
      updateBook(id, (b) => ({ completed: b.completed.includes(step) ? b.completed : [...b.completed, step] })),
    [updateBook],
  );

  return (
    <Ctx.Provider value={{ ready, books, createBook, updateBook, deleteBook, completeStep }}>
      {children}
    </Ctx.Provider>
  );
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore must be used inside StoreProvider");
  return s;
}

export function useBook(id: string) {
  const s = useStore();
  const book = s.books.find((b) => b.id === id);
  return { ...s, book };
}
