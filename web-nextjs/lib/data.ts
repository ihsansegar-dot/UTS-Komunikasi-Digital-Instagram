import fs from "node:fs";
import path from "node:path";

export type CommentRow = {
  comment_id: string;
  created_at: string;
  username: string;
  text: string;
  sentiment_label: "positive" | "neutral" | "negative";
  sentiment_score: number;
  post_date: string;
};

export type AnalyticsData = {
  summary: {
    total_comments: number;
    average_score: number;
    unique_users: number;
    total_post_dates: number;
  };
  sentiment_breakdown: Array<{ name: string; value: number }>;
  comments_by_post_date: Array<{ post_date: string; count: number }>;
  top_words: Array<{ word: string; count: number }>;
  latest_comments: CommentRow[];
};

const DATA_PATH = path.join(process.cwd(), "public", "data", "analytics.json");

export function readAnalyticsData(): AnalyticsData {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as AnalyticsData;
}
