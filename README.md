# UTS Komunikasi Digital
## Analisis Sentimen Percakapan Instagram - Kampanye Pilkada DKI Jakarta 2024

Proyek ini membangun pipeline analitik komentar Instagram dan dashboard interaktif untuk mengevaluasi sentimen publik terhadap konten kampanye Pilkada DKI Jakarta 2024.

## Tujuan Riset

1. Mengukur distribusi sentimen (`positive`, `neutral`, `negative`) pada komentar audiens.
2. Mengidentifikasi dinamika percakapan berdasarkan tanggal posting (`post_date`).
3. Menyediakan dashboard eksploratif untuk mendukung interpretasi strategi komunikasi digital kampanye.

## Metodologi Singkat

- Sumber data: ekspor komentar Instagram format CSV.
- Normalisasi schema: mendukung dua bentuk kolom CSV yang berbeda.
- Enrichment: pemetaan `source_file` -> `post_date` menggunakan file mapping.
- Scoring sentimen: pendekatan lexicon rule-based Bahasa Indonesia (offline).
- Penyimpanan: hasil akhir ke SQLite (`data/db/sentiment.db`) dan CSV olahan.

## Struktur Proyek

```text
pilkada_dki_sentiment/
├─ app/
│  └─ dashboard.py
├─ src/
│  └─ build_sentiment_db.py
├─ data/
│  ├─ raw/                        # tempat CSV komentar mentah
│  ├─ mapping/
│  │  └─ post_mapping.template.csv
│  ├─ processed/                  # output CSV hasil olah
│  └─ db/                         # output database SQLite
├─ .streamlit/
│  └─ config.toml
├─ requirements.txt
├─ Procfile
├─ vercel.json
└─ README.md
```

## Persiapan Data

1. Letakkan file CSV komentar ke folder `data/raw/` (atau folder lain yang Anda tentukan saat build).
2. Buat file mapping dari template `data/mapping/post_mapping.template.csv` dengan format:

```csv
File Name;Post Date;Account
DAj5NrFya4j.csv;1 Oktober 2024;https://www.instagram.com/p/DAj5NrFya4j/
...
```

## Menjalankan Lokal

1. Install dependency:

```bash
pip install -r requirements.txt
```

2. Build database sentimen:

```bash
python src/build_sentiment_db.py \
  --input_dir "C:/Users/sinar/Downloads" \
  --mapping_csv "C:/Users/sinar/Downloads/Data Tugas UTS.csv" \
  --output_db "data/db/sentiment.db" \
  --output_csv "data/processed/comments_normalized.csv"
```

3. Jalankan dashboard:

```bash
streamlit run app/dashboard.py
```

4. Buka:

```text
http://127.0.0.1:8501
```

## Push ke GitHub

Ganti `YOUR_USERNAME` jika perlu, lalu jalankan dari root proyek:

```bash
git init
git add .
git commit -m "Initial commit: Instagram sentiment dashboard"
git branch -M main
git remote add origin https://github.com/ihsansegar-dot/UTS-Komunikasi-Digital-Instagram.git
git push -u origin main
```

## Catatan Deploy ke Vercel

Vercel sangat optimal untuk aplikasi serverless/statik, sedangkan Streamlit membutuhkan proses Python web app yang persisten. Karena itu:

1. Repo ini tetap siap di-`import` ke Vercel untuk source management.
2. Untuk dashboard Streamlit yang benar-benar berjalan, platform yang lebih cocok: Streamlit Community Cloud, Railway, Render, atau Hugging Face Spaces.

Jika Anda tetap ingin, saya bisa bantu siapkan versi `Next.js + API` agar native cocok untuk Vercel.

## Opsi Native Vercel (Next.js)

Versi frontend Next.js sudah disiapkan di folder `web-nextjs/`.

Langkah cepat:

1. Build data analitik dulu dari pipeline Python:
```bash
python src/build_sentiment_db.py \
  --input_dir "C:/Users/sinar/Downloads" \
  --mapping_csv "C:/Users/sinar/Downloads/Data Tugas UTS.csv" \
  --output_db "data/db/sentiment.db" \
  --output_csv "data/processed/comments_normalized.csv"
```
2. Masuk ke folder Next.js:
```bash
cd web-nextjs
```
3. Generate JSON dashboard:
```bash
npm install
npm run prepare-data
```
4. Jalankan lokal:
```bash
npm run dev
```
5. Deploy di Vercel:
- Import repository dari GitHub.
- Set **Root Directory** ke `web-nextjs`.
- Deploy (default Next.js build).

## Lisensi

Untuk kebutuhan akademik/UTS.
