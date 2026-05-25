from pathlib import Path
import sqlite3

import pandas as pd
import plotly.express as px
import streamlit as st

st.set_page_config(page_title="Sentimen Pilkada DKI 2024", layout="wide")

SENTIMENT_COLORS = {
    "positive": "#22C55E",
    "neutral": "#94A3B8",
    "negative": "#EF4444",
}
PRIMARY = "#0F172A"
ACCENT = "#C9A227"
PANEL = "#111827"
TEXT_MUTED = "#B6C2D1"

st.markdown(
    f"""
    <style>
    .stApp {{
        background: radial-gradient(circle at 0% 0%, #1f2937 0%, #0b1220 38%, #080d17 100%);
        color: #f8fafc;
    }}
    .block-container {{
        padding-top: 1.5rem;
    }}
    [data-testid="stSidebar"] {{
        background: linear-gradient(180deg, #0f172a 0%, #111827 100%);
        border-right: 1px solid rgba(255,255,255,0.08);
    }}
    .hero {{
        padding: 1.2rem 1.4rem;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.88));
        border: 1px solid rgba(201,162,39,0.22);
        box-shadow: 0 16px 35px rgba(0,0,0,0.28);
        margin-bottom: 1rem;
    }}
    .hero h1 {{
        margin: 0 0 0.3rem 0;
        color: #f8fafc;
        font-size: 1.8rem;
        font-weight: 700;
        letter-spacing: 0.2px;
    }}
    .hero p {{
        margin: 0;
        color: {TEXT_MUTED};
        font-size: 0.96rem;
    }}
    [data-testid="stMetric"] {{
        background: linear-gradient(160deg, rgba(15,23,42,0.88), rgba(17,24,39,0.82));
        border: 1px solid rgba(201,162,39,0.15);
        border-radius: 14px;
        padding: 0.75rem 0.9rem;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }}
    [data-testid="stMetricLabel"] {{
        color: {TEXT_MUTED};
    }}
    [data-testid="stMetricValue"] {{
        color: #f8fafc;
        font-weight: 700;
    }}
    </style>
    """,
    unsafe_allow_html=True,
)

BASE_DIR = Path(__file__).resolve().parents[1]
DB_PATH = BASE_DIR / "data" / "db" / "sentiment.db"

st.markdown(
    """
    <div class="hero">
        <h1>Dashboard Sentimen Instagram</h1>
        <p>Analitik percakapan publik terkait konten kampanye Pilkada DKI Jakarta 2024.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

if not DB_PATH.exists():
    st.error(f"Database tidak ditemukan: {DB_PATH}")
    st.stop()

@st.cache_data
def load_data(db_path: Path) -> pd.DataFrame:
    conn = sqlite3.connect(db_path)
    try:
        df = pd.read_sql_query("SELECT * FROM comments", conn)
    finally:
        conn.close()
    return df


df = load_data(DB_PATH)

if df.empty:
    st.warning("Data kosong.")
    st.stop()

if "post_date" not in df.columns:
    df["post_date"] = df["source_file"]

# filter sidebar
st.sidebar.header("Filter")
source_options = sorted(df["post_date"].dropna().unique().tolist())
selected_sources = st.sidebar.multiselect("Post Date", source_options, default=source_options)

sentiment_options = ["positive", "neutral", "negative"]
selected_sentiments = st.sidebar.multiselect("Sentiment", sentiment_options, default=sentiment_options)

q = st.sidebar.text_input("Cari keyword komentar")

filtered = df[df["post_date"].isin(selected_sources) & df["sentiment_label"].isin(selected_sentiments)].copy()
if q.strip():
    filtered = filtered[filtered["text"].str.contains(q, case=False, na=False)]

col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Komentar", f"{len(filtered):,}")
col2.metric("Rata-rata Skor", f"{filtered['sentiment_score'].mean():.2f}")
col3.metric("Unique User", f"{filtered['username'].nunique():,}")
col4.metric("Jumlah Post Date", f"{filtered['post_date'].nunique():,}")

c1, c2 = st.columns(2)

with c1:
    sent_counts = filtered["sentiment_label"].value_counts().rename_axis("sentiment").reset_index(name="count")
    fig_pie = px.pie(
        sent_counts,
        values="count",
        names="sentiment",
        title="Distribusi Sentimen",
        color="sentiment",
        color_discrete_map=SENTIMENT_COLORS,
    )
    fig_pie.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#E5E7EB"),
        title_font=dict(color="#F8FAFC", size=20),
        legend=dict(orientation="h", y=-0.15),
    )
    st.plotly_chart(fig_pie, use_container_width=True)

with c2:
    top_sources = filtered["post_date"].value_counts().head(10).rename_axis("post_date").reset_index(name="count")
    fig_bar = px.bar(
        top_sources,
        x="post_date",
        y="count",
        title="Top 10 Post Date by Komentar",
        color_discrete_sequence=[ACCENT],
    )
    fig_bar.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#E5E7EB"),
        title_font=dict(color="#F8FAFC", size=20),
        xaxis=dict(showgrid=False, title="Post Date"),
        yaxis=dict(showgrid=True, gridcolor="rgba(148,163,184,0.15)", title="Jumlah Komentar"),
    )
    st.plotly_chart(fig_bar, use_container_width=True)

st.subheader("Komentar Terbaru (sample)")
show_cols = ["post_date", "created_at", "username", "text", "sentiment_label", "sentiment_score"]
st.dataframe(filtered[show_cols].head(200), use_container_width=True, height=450)

st.subheader("Top Kata (sederhana)")
words = (
    filtered["text"].astype(str)
    .str.lower()
    .str.replace(r"[^a-z0-9_\s]", " ", regex=True)
    .str.split()
    .explode()
)
stopwords = {"dan", "yang", "di", "ke", "ini", "itu", "pak", "nya", "buat", "untuk", "dengan", "jadi", "ga", "gak", "nggak"}
words = words[(words.notna()) & (words.str.len() >= 3) & (~words.isin(stopwords))]

if not words.empty:
    top_words = words.value_counts().head(20).rename_axis("word").reset_index(name="count")
    fig_words = px.bar(
        top_words,
        x="word",
        y="count",
        title="20 Kata Paling Sering Muncul",
        color_discrete_sequence=["#38BDF8"],
    )
    fig_words.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(color="#E5E7EB"),
        title_font=dict(color="#F8FAFC", size=20),
        xaxis=dict(showgrid=False, title="Kata"),
        yaxis=dict(showgrid=True, gridcolor="rgba(148,163,184,0.15)", title="Frekuensi"),
    )
    st.plotly_chart(fig_words, use_container_width=True)
else:
    st.info("Tidak ada kata yang bisa ditampilkan untuk filter saat ini.")
