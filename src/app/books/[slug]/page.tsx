import { notFound } from "next/navigation";
import { BookDetailPage } from "@/components/books/book-detail-page";
import { getBookBySlug, getBooks } from "@/lib/content/library";

export function generateStaticParams() {
  return getBooks().map((book) => ({ slug: book.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const book = getBookBySlug(slug);

  if (!book) {
    notFound();
  }

  return <BookDetailPage book={book} />;
}
