import { HomePage } from "@/components/home/home-page";
import { getBooks } from "@/lib/content/library";

export default function Page() {
  return <HomePage books={getBooks()} />;
}
