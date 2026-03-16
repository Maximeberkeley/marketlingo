export interface NewsItem {
  id: string;
  title: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  categoryTag: string;
  summary?: string;
  imageUrl?: string | null;
}
