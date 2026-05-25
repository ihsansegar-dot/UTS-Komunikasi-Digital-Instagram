(async function () {
  const res = await fetch("./data/analytics.json");
  const data = await res.json();

  const metrics = [
    ["Total Komentar", Number(data.summary.total_comments || 0).toLocaleString("id-ID")],
    ["Rata-rata Skor", Number(data.summary.average_score || 0).toFixed(2)],
    ["Unique User", Number(data.summary.unique_users || 0).toLocaleString("id-ID")],
    ["Jumlah Konten", Number(data.summary.total_post_dates || 0).toLocaleString("id-ID")],
  ];

  document.getElementById("metrics").innerHTML = metrics
    .map(([k, v]) => `<div class="card"><div class="metric-label">${k}</div><div class="metric-value">${v}</div></div>`)
    .join("");

  const colors = { positive: "#39ff88", neutral: "#9ca3af", negative: "#ff4d6d" };
  const chartTick = "#8bd8aa";
  const grid = "rgba(57,255,136,0.14)";
  const tooltip = {
    backgroundColor: "rgba(0,0,0,0.95)",
    borderColor: "rgba(57,255,136,0.4)",
    borderWidth: 1,
    titleColor: "#d6ffe8",
    bodyColor: "#d6ffe8",
  };

  new Chart(document.getElementById("sentimentChart"), {
    type: "doughnut",
    data: {
      labels: data.sentiment_breakdown.map((x) => x.name),
      datasets: [
        {
          data: data.sentiment_breakdown.map((x) => x.value),
          backgroundColor: data.sentiment_breakdown.map((x) => colors[x.name] || "#9ca3af"),
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "#d6ffe8" } },
        tooltip,
      },
    },
  });

  new Chart(document.getElementById("postDateChart"), {
    type: "bar",
    data: {
      labels: data.comments_by_post_date.map((x) => x.post_date),
      datasets: [{ label: "Komentar", data: data.comments_by_post_date.map((x) => x.count), backgroundColor: "#2ee57a" }],
    },
    options: {
      scales: {
        x: { ticks: { color: chartTick, maxRotation: 20, minRotation: 20 }, grid: { color: grid } },
        y: { ticks: { color: chartTick }, grid: { color: grid } },
      },
      plugins: { legend: { labels: { color: "#d6ffe8" } }, tooltip },
    },
  });

  const byContent = (data.comments_by_content || []).slice(0, 12);
  new Chart(document.getElementById("contentChart"), {
    type: "bar",
    data: {
      labels: byContent.map((x) => x.content),
      datasets: [{ label: "Komentar", data: byContent.map((x) => x.count), backgroundColor: "#00f0ff" }],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: { ticks: { color: chartTick }, grid: { color: grid } },
        y: { ticks: { color: chartTick }, grid: { color: grid } },
      },
      plugins: { legend: { labels: { color: "#d6ffe8" } }, tooltip },
    },
  });

  new Chart(document.getElementById("lengthChart"), {
    type: "bar",
    data: {
      labels: (data.comment_length_distribution || []).map((x) => x.bucket),
      datasets: [{ label: "Komentar", data: (data.comment_length_distribution || []).map((x) => x.count), backgroundColor: "#00ffa8" }],
    },
    options: {
      scales: {
        x: { ticks: { color: chartTick }, grid: { color: grid } },
        y: { ticks: { color: chartTick }, grid: { color: grid } },
      },
      plugins: { legend: { labels: { color: "#d6ffe8" } }, tooltip },
    },
  });

  const topWords = (data.top_words || []).slice(0, 12);
  new Chart(document.getElementById("topWordsChart"), {
    type: "bar",
    data: {
      labels: topWords.map((x) => x.word),
      datasets: [{ label: "Frekuensi", data: topWords.map((x) => x.count), backgroundColor: "#39ff88" }],
    },
    options: {
      indexAxis: "y",
      scales: {
        x: { ticks: { color: chartTick }, grid: { color: grid } },
        y: { ticks: { color: chartTick }, grid: { color: grid } },
      },
      plugins: { legend: { labels: { color: "#d6ffe8" } }, tooltip },
    },
  });

  const maxWord = Math.max(...(data.top_words || []).map((x) => x.count), 1);
  document.getElementById("wordCloud").innerHTML = (data.top_words || [])
    .slice(0, 40)
    .map((w) => {
      const size = 0.88 + (w.count / maxWord) * 1.52;
      const alpha = 0.55 + (w.count / maxWord) * 0.45;
      return `<span class="word-chip" style="font-size:${size.toFixed(2)}rem;color:rgba(57,255,136,${alpha.toFixed(2)})">${String(w.word || "").replace(/</g, "&lt;")}</span>`;
    })
    .join("");

  const riskRows = (data.negative_risk_contents || [])
    .map(
      (r) =>
        `<tr><td>${(r.content || "").replace(/</g, "&lt;")}</td><td>${Number(r.total_comments || 0).toLocaleString("id-ID")}</td><td>${Number(r.negative_comments || 0).toLocaleString("id-ID")}</td><td>${(Number(r.negative_ratio || 0) * 100).toFixed(2)}%</td><td>${Number(r.risk_score || 0).toFixed(3)}</td></tr>`
    )
    .join("");
  document.getElementById("riskRows").innerHTML = riskRows;

  const rows = (data.latest_comments || [])
    .slice(0, 200)
    .map(
      (r) =>
        `<tr><td>${r.post_date || ""}</td><td>${r.created_at || ""}</td><td>${r.username || ""}</td><td>${String(r.text || "").replace(/</g, "&lt;")}</td><td><span class="badge ${r.sentiment_label}">${r.sentiment_label || ""}</span></td><td>${r.sentiment_score ?? ""}</td></tr>`
    )
    .join("");
  document.getElementById("commentRows").innerHTML = rows;
})();
