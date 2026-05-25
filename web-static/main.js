(async function(){
  const res = await fetch('./data/analytics.json');
  const data = await res.json();

  const metrics = [
    ['Total Komentar', Number(data.summary.total_comments||0).toLocaleString('id-ID')],
    ['Rata-rata Skor', Number(data.summary.average_score||0).toFixed(2)],
    ['Unique User', Number(data.summary.unique_users||0).toLocaleString('id-ID')],
    ['Jumlah Post Date', Number(data.summary.total_post_dates||0).toLocaleString('id-ID')]
  ];

  document.getElementById('metrics').innerHTML = metrics.map(([k,v]) =>
    `<div class="card"><div class="metric-label">${k}</div><div class="metric-value">${v}</div></div>`).join('');

  const colors = {positive:'#22C55E',neutral:'#94A3B8',negative:'#EF4444'};
  new Chart(document.getElementById('sentimentChart'), {
    type:'doughnut',
    data:{labels:data.sentiment_breakdown.map(x=>x.name),datasets:[{data:data.sentiment_breakdown.map(x=>x.value),backgroundColor:data.sentiment_breakdown.map(x=>colors[x.name]||'#9ca3af')}]},
    options:{plugins:{legend:{labels:{color:'#e5e7eb'}}}}
  });

  new Chart(document.getElementById('postDateChart'), {
    type:'bar',
    data:{labels:data.comments_by_post_date.map(x=>x.post_date),datasets:[{label:'Komentar',data:data.comments_by_post_date.map(x=>x.count),backgroundColor:'#d4af37'}]},
    options:{scales:{x:{ticks:{color:'#cbd5e1'}},y:{ticks:{color:'#cbd5e1'}}},plugins:{legend:{labels:{color:'#e5e7eb'}}}}
  });

  const rows = (data.latest_comments||[]).slice(0,200).map(r =>
    `<tr><td>${r.post_date||''}</td><td>${r.created_at||''}</td><td>${r.username||''}</td><td>${(r.text||'').replace(/</g,'&lt;')}</td><td><span class="badge ${r.sentiment_label}">${r.sentiment_label||''}</span></td><td>${r.sentiment_score??''}</td></tr>`
  ).join('');
  document.getElementById('commentRows').innerHTML = rows;
})();
