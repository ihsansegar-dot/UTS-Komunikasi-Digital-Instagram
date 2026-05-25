# Next.js Frontend (Native Vercel)

Frontend ringan berbasis Next.js untuk visualisasi analitik sentimen Pilkada DKI 2024.

## Jalankan Lokal

```bash
npm install
npm run prepare-data
npm run dev
```

Buka `http://localhost:3000`.

## Sumber Data

Script `npm run prepare-data` membaca file:

- `../data/processed/comments_normalized.csv`

Lalu menghasilkan:

- `public/data/analytics.json`

## Deploy ke Vercel

1. Push repo ke GitHub.
2. Import project di Vercel.
3. Set **Root Directory** ke `web-nextjs`.
4. Build command: `npm run build`.
5. Output: default Next.js.

## Endpoint

- `GET /api/analytics` -> JSON analitik untuk dashboard.
