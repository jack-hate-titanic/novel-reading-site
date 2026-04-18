import { notFound } from "next/navigation";
import { ReaderPage } from "@/components/reader/reader-page";
import {
  getAdjacentChapters,
  getBookBySlug,
  getBooks,
  getChapterBySlugs,
} from "@/lib/content/library";

export function generateStaticParams() {
  return getBooks().flatMap((book) =>
    book.chapters.map((chapter) => ({
      bookSlug: book.slug,
      chapterSlug: chapter.slug,
    })),
  );
}

export default async function Page({
  params,
}: {
  params: Promise<{ bookSlug: string; chapterSlug: string }>;
}) {
  const { bookSlug, chapterSlug } = await params;
  const book = getBookBySlug(bookSlug);
  const chapter = getChapterBySlugs(bookSlug, chapterSlug);

  if (!book || !chapter) {
    notFound();
  }

  const adjacent = getAdjacentChapters(bookSlug, chapterSlug);

  return (
    <ReaderPage
      book={book}
      chapter={chapter}
      previousHref={
        adjacent.previous ? `/read/${bookSlug}/${adjacent.previous.slug}` : null
      }
      nextHref={adjacent.next ? `/read/${bookSlug}/${adjacent.next.slug}` : null}
    />
  );
}
