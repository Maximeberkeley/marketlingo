import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { NewsItem } from "./types";

export function useNewsData(marketId: string) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapDbItem = (item: any): NewsItem => ({
    id: item.id,
    title: item.title,
    sourceName: item.source_name,
    sourceUrl: item.source_url,
    publishedAt: new Date(item.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    categoryTag: item.category_tag || "Industry",
    summary: item.summary || undefined,
    imageUrl: item.image_url || undefined,
  });

  const fetchNews = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!forceRefresh) {
        const { data, error: dbError } = await supabase
          .from("news_items")
          .select("*")
          .eq("market_id", marketId)
          .order("published_at", { ascending: false })
          .limit(10);

        if (!dbError && data && data.length > 0) {
          setNews(data.map(mapDbItem));
          setIsLoading(false);
          return;
        }
      }

      const { data: liveData, error: fnError } = await supabase.functions.invoke("fetch-market-news", {
        body: { marketId },
      });

      if (fnError) {
        const { data: fallbackData } = await supabase
          .from("news_items")
          .select("*")
          .eq("market_id", marketId)
          .order("published_at", { ascending: false })
          .limit(10);

        if (fallbackData && fallbackData.length > 0) {
          setNews(fallbackData.map(mapDbItem));
        } else {
          setError("Unable to load news");
        }
        return;
      }

      if (liveData?.success && liveData.data?.length > 0) {
        const formatted: NewsItem[] = liveData.data.map((item: any) => ({
          id: item.id,
          title: item.title,
          sourceName: item.sourceName,
          sourceUrl: item.sourceUrl,
          publishedAt: item.publishedAt,
          categoryTag: item.categoryTag || "Industry",
          summary: item.summary || undefined,
          imageUrl: item.imageUrl || undefined,
        }));
        setNews(formatted);
      } else {
        const { data: fallbackData } = await supabase
          .from("news_items")
          .select("*")
          .eq("market_id", marketId)
          .order("published_at", { ascending: false })
          .limit(10);

        if (fallbackData && fallbackData.length > 0) {
          setNews(fallbackData.map(mapDbItem));
        } else {
          setNews([]);
        }
      }
    } catch (err) {
      console.error("Error fetching news:", err);
      setError("Failed to connect to news service");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [marketId]);

  return { news, isLoading, error, refresh: () => fetchNews(true) };
}
