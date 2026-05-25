import fs from "node:fs";
import path from "node:path";

const inputCsv = path.join(process.cwd(), "..", "data", "processed", "comments_normalized.csv");
const outJson = path.join(process.cwd(), "public", "data", "analytics.json");

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function readCsv(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    return row;
  });
}

function topWords(rows) {
  const stop = new Set(["dan", "yang", "di", "ke", "ini", "itu", "pak", "nya", "buat", "untuk", "dengan", "jadi", "ga", "gak", "nggak"]);
  const counts = new Map();
  for (const row of rows) {
    const txt = String(row.text || "").toLowerCase().replace(/[^a-z0-9_\s]/g, " ");
    for (const word of txt.split(/\s+/)) {
      if (!word || word.length < 3 || stop.has(word)) continue;
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));
}

function lengthBucket(textLength) {
  if (textLength < 20) return "0-19";
  if (textLength < 40) return "20-39";
  if (textLength < 80) return "40-79";
  if (textLength < 120) return "80-119";
  return "120+";
}

function buildAnalytics(rows) {
  const comments = rows.map((r) => ({
    comment_id: String(r.comment_id || ""),
    created_at: String(r.created_at || ""),
    username: String(r.username || ""),
    text: String(r.text || ""),
    sentiment_label: String(r.sentiment_label || "neutral"),
    sentiment_score: Number(r.sentiment_score || 0),
    post_date: String(r.post_date || r.source_file || "Unknown"),
  }));

  const sentimentMap = new Map();
  const postDateMap = new Map();
  const contentMap = new Map();
  const commentLengthMap = new Map();
  const users = new Set();
  let scoreSum = 0;

  for (const c of comments) {
    const content = c.post_date || "Unknown";
    const textLength = c.text.length;
    const bucket = lengthBucket(textLength);

    sentimentMap.set(c.sentiment_label, (sentimentMap.get(c.sentiment_label) || 0) + 1);
    postDateMap.set(c.post_date, (postDateMap.get(c.post_date) || 0) + 1);
    commentLengthMap.set(bucket, (commentLengthMap.get(bucket) || 0) + 1);
    users.add(c.username);
    scoreSum += c.sentiment_score;

    if (!contentMap.has(content)) {
      contentMap.set(content, {
        total_comments: 0,
        negative_comments: 0,
        score_sum: 0,
      });
    }
    const slot = contentMap.get(content);
    slot.total_comments += 1;
    slot.score_sum += c.sentiment_score;
    if (c.sentiment_label === "negative") {
      slot.negative_comments += 1;
    }
  }

  const commentsByContent = [...contentMap.entries()]
    .map(([content, v]) => ({ content, count: v.total_comments }))
    .sort((a, b) => b.count - a.count);

  const negativeRiskContents = [...contentMap.entries()]
    .map(([content, v]) => {
      const negativeRatio = v.total_comments ? v.negative_comments / v.total_comments : 0;
      const averageScore = v.total_comments ? v.score_sum / v.total_comments : 0;
      return {
        content,
        total_comments: v.total_comments,
        negative_comments: v.negative_comments,
        negative_ratio: Number(negativeRatio.toFixed(4)),
        average_score: Number(averageScore.toFixed(4)),
        risk_score: Number((negativeRatio * Math.log1p(v.total_comments)).toFixed(4)),
      };
    })
    .sort((a, b) =>
      b.risk_score - a.risk_score ||
      b.negative_ratio - a.negative_ratio ||
      b.negative_comments - a.negative_comments
    )
    .slice(0, 15);

  const bucketOrder = ["0-19", "20-39", "40-79", "80-119", "120+"];
  const commentLengthDistribution = bucketOrder.map((bucket) => ({
    bucket,
    count: commentLengthMap.get(bucket) || 0,
  }));

  return {
    summary: {
      total_comments: comments.length,
      average_score: comments.length ? scoreSum / comments.length : 0,
      unique_users: users.size,
      total_post_dates: postDateMap.size,
    },
    sentiment_breakdown: ["positive", "neutral", "negative"].map((key) => ({ name: key, value: sentimentMap.get(key) || 0 })),
    comments_by_post_date: [...postDateMap.entries()].map(([post_date, count]) => ({ post_date, count })),
    comments_by_content: commentsByContent,
    negative_risk_contents: negativeRiskContents,
    comment_length_distribution: commentLengthDistribution,
    top_words: topWords(comments),
    latest_comments: comments.slice(0, 200),
  };
}

if (!fs.existsSync(inputCsv)) {
  console.error(`Input not found: ${inputCsv}`);
  process.exit(1);
}

const rows = readCsv(inputCsv);
const analytics = buildAnalytics(rows);
fs.writeFileSync(outJson, JSON.stringify(analytics, null, 2), "utf-8");
console.log(`Written: ${outJson}`);
