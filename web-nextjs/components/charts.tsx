"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PieItem = { name: string; value: number };
type PostDateItem = { post_date: string; count: number };
type ContentItem = { content: string; count: number };
type LengthItem = { bucket: string; count: number };
type TopWordItem = { word: string; count: number };

const COLORS: Record<string, string> = {
  positive: "#39ff88",
  neutral: "#9ca3af",
  negative: "#ff4d6d",
};

const chartTooltipStyle = {
  background: "rgba(0,0,0,0.95)",
  border: "1px solid rgba(57,255,136,0.4)",
  color: "#d1fae5",
};

function shorten(input: string, maxLen = 18) {
  return input.length > maxLen ? `${input.slice(0, maxLen - 1)}…` : input;
}

export function SentimentPie({ data }: { data: PieItem[] }) {
  return (
    <div style={{ width: "100%", height: 310 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={108}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || "#9CA3AF"} />
            ))}
          </Pie>
          <Tooltip contentStyle={chartTooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PostDateBar({ data }: { data: PostDateItem[] }) {
  return (
    <div style={{ width: "100%", height: 310 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
          <CartesianGrid stroke="rgba(57,255,136,0.16)" vertical={false} />
          <XAxis dataKey="post_date" tickFormatter={(v) => shorten(String(v), 14)} stroke="#86efac" angle={-20} textAnchor="end" interval={0} />
          <YAxis stroke="#86efac" />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="count" fill="#2ee57a" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ContentBar({ data }: { data: ContentItem[] }) {
  const sliced = data.slice(0, 12);
  return (
    <div style={{ width: "100%", height: 360 }}>
      <ResponsiveContainer>
        <BarChart data={sliced} layout="vertical" margin={{ top: 6, right: 20, left: 42, bottom: 6 }}>
          <CartesianGrid stroke="rgba(57,255,136,0.14)" horizontal={false} />
          <XAxis type="number" stroke="#86efac" />
          <YAxis type="category" dataKey="content" width={120} tickFormatter={(v) => shorten(String(v), 16)} stroke="#86efac" />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="count" fill="#00f0ff" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CommentLengthBar({ data }: { data: LengthItem[] }) {
  return (
    <div style={{ width: "100%", height: 310 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 10 }}>
          <CartesianGrid stroke="rgba(57,255,136,0.14)" vertical={false} />
          <XAxis dataKey="bucket" stroke="#86efac" />
          <YAxis stroke="#86efac" />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="count" fill="#00ffa8" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TopWordsBar({ data }: { data: TopWordItem[] }) {
  const sliced = data.slice(0, 12);
  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer>
        <BarChart data={sliced} layout="vertical" margin={{ top: 6, right: 18, left: 22, bottom: 6 }}>
          <CartesianGrid stroke="rgba(57,255,136,0.14)" horizontal={false} />
          <XAxis type="number" stroke="#86efac" />
          <YAxis type="category" dataKey="word" width={90} stroke="#86efac" />
          <Tooltip contentStyle={chartTooltipStyle} />
          <Bar dataKey="count" fill="#39ff88" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WordCloud({ words }: { words: TopWordItem[] }) {
  const max = Math.max(...words.map((w) => w.count), 1);
  return (
    <div className="word-cloud">
      {words.slice(0, 40).map((w) => {
        const size = 0.88 + (w.count / max) * 1.52;
        const alpha = 0.55 + (w.count / max) * 0.45;
        return (
          <span
            key={w.word}
            className="word-chip"
            style={{
              fontSize: `${size}rem`,
              color: `rgba(57,255,136,${alpha.toFixed(2)})`,
            }}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}
