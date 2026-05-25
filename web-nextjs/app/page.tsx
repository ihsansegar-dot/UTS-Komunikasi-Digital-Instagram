import { readAnalyticsData } from "@/lib/data";
import { PostDateBar, SentimentPie } from "@/components/charts";

export default function HomePage() {
  const analytics = readAnalyticsData();

  return (
    <main className="container">
      <section className="hero">
        <h1>Dashboard Sentimen Instagram</h1>
        <p>Analitik percakapan publik terkait konten kampanye Pilkada DKI Jakarta 2024 (Next.js Native).</p>
      </section>

      <section className="grid-4">
        <div className="card"><div className="metric-label">Total Komentar</div><div className="metric-value">{analytics.summary.total_comments.toLocaleString("id-ID")}</div></div>
        <div className="card"><div className="metric-label">Rata-rata Skor</div><div className="metric-value">{analytics.summary.average_score.toFixed(2)}</div></div>
        <div className="card"><div className="metric-label">Unique User</div><div className="metric-value">{analytics.summary.unique_users.toLocaleString("id-ID")}</div></div>
        <div className="card"><div className="metric-label">Jumlah Post Date</div><div className="metric-value">{analytics.summary.total_post_dates.toLocaleString("id-ID")}</div></div>
      </section>

      <h2 className="section-title">Distribusi & Aktivitas</h2>
      <section className="grid-2">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Distribusi Sentimen</h3>
          <SentimentPie data={analytics.sentiment_breakdown} />
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Komentar per Post Date</h3>
          <PostDateBar data={analytics.comments_by_post_date} />
        </div>
      </section>

      <h2 className="section-title">Komentar Terbaru (Sample)</h2>
      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Post Date</th>
              <th>Created At</th>
              <th>Username</th>
              <th>Komentar</th>
              <th>Sentimen</th>
              <th>Skor</th>
            </tr>
          </thead>
          <tbody>
            {analytics.latest_comments.map((row) => (
              <tr key={`${row.comment_id}-${row.username}`}>
                <td>{row.post_date}</td>
                <td>{row.created_at}</td>
                <td>{row.username}</td>
                <td>{row.text}</td>
                <td><span className={`badge ${row.sentiment_label}`}>{row.sentiment_label}</span></td>
                <td>{row.sentiment_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
