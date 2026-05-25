import { readAnalyticsData } from "../lib/data";
import { CommentLengthBar, ContentBar, PostDateBar, SentimentPie, TopWordsBar, WordCloud } from "../components/charts";

export default function HomePage() {
  const analytics = readAnalyticsData();

  return (
    <main className="container">
      <section className="hero">
        <h1>Matrix Sentiment Console</h1>
        <p>Pemantauan percakapan publik Instagram untuk konten kampanye Pilkada DKI Jakarta 2024.</p>
      </section>

      <section className="grid-4">
        <div className="card">
          <div className="metric-label">Total Komentar</div>
          <div className="metric-value">{analytics.summary.total_comments.toLocaleString("id-ID")}</div>
        </div>
        <div className="card">
          <div className="metric-label">Rata-rata Skor</div>
          <div className="metric-value">{analytics.summary.average_score.toFixed(2)}</div>
        </div>
        <div className="card">
          <div className="metric-label">Unique User</div>
          <div className="metric-value">{analytics.summary.unique_users.toLocaleString("id-ID")}</div>
        </div>
        <div className="card">
          <div className="metric-label">Jumlah Konten</div>
          <div className="metric-value">{analytics.summary.total_post_dates.toLocaleString("id-ID")}</div>
        </div>
      </section>

      <h2 className="section-title">Distribusi Sentimen</h2>
      <section className="grid-2">
        <div className="card">
          <h3 className="card-title">Pie Sentimen</h3>
          <SentimentPie data={analytics.sentiment_breakdown} />
        </div>
        <div className="card">
          <h3 className="card-title">Komentar per Post Date</h3>
          <PostDateBar data={analytics.comments_by_post_date} />
        </div>
      </section>

      <h2 className="section-title">Analisis Konten</h2>
      <section className="grid-2">
        <div className="card">
          <h3 className="card-title">Komentar per Konten</h3>
          <ContentBar data={analytics.comments_by_content} />
        </div>
        <div className="card">
          <h3 className="card-title">Distribusi Panjang Komentar</h3>
          <CommentLengthBar data={analytics.comment_length_distribution} />
        </div>
      </section>

      <h2 className="section-title">Kata Paling Sering Muncul</h2>
      <section className="grid-2">
        <div className="card">
          <h3 className="card-title">Word Cloud</h3>
          <WordCloud words={analytics.top_words} />
        </div>
        <div className="card">
          <h3 className="card-title">Top Kata</h3>
          <TopWordsBar data={analytics.top_words} />
        </div>
      </section>

      <h2 className="section-title">Konten dengan Risiko Negatif Tertinggi</h2>
      <section className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Konten</th>
              <th>Total Komentar</th>
              <th>Negatif</th>
              <th>Rasio Negatif</th>
              <th>Risk Score</th>
            </tr>
          </thead>
          <tbody>
            {analytics.negative_risk_contents.map((row) => (
              <tr key={row.content}>
                <td>{row.content}</td>
                <td>{row.total_comments.toLocaleString("id-ID")}</td>
                <td>{row.negative_comments.toLocaleString("id-ID")}</td>
                <td>{(row.negative_ratio * 100).toFixed(2)}%</td>
                <td>{row.risk_score.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
                <td>
                  <span className={`badge ${row.sentiment_label}`}>{row.sentiment_label}</span>
                </td>
                <td>{row.sentiment_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
