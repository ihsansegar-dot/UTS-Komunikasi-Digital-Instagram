"use client";

import { BarChart, Bar, CartesianGrid, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type PieItem = { name: string; value: number };
type BarItem = { post_date: string; count: number };

const COLORS: Record<string, string> = {
  positive: "#22C55E",
  neutral: "#94A3B8",
  negative: "#EF4444",
};

export function SentimentPie({ data }: { data: PieItem[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={105}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name] || "#9CA3AF"} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PostDateBar({ data }: { data: BarItem[] }) {
  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="post_date" angle={-25} textAnchor="end" interval={0} stroke="#cbd5e1" />
          <YAxis stroke="#cbd5e1" />
          <Tooltip />
          <Bar dataKey="count" fill="#d4af37" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
