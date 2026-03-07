/* ================= GLOBAL STATE ================= */

let businessData     = [];
let currentCurrency  = "GBP";

let revenueChart     = null;
let profitChart      = null;
let expenseChart     = null;

let performanceBarChart  = null;
let distributionPieChart = null;
let aiForecastChart      = null;

let aiChatHistory    = [];
let lastAIInsightText = ""; // stored for PDF


/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  bindGlobalFunctions();
  renderAIInsights();
});


/* ================= CURRENCY ================= */

function setCurrency(currency) {
  currentCurrency = currency;
  updateAll();
}

function formatCurrency(val) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currentCurrency
  }).format(val);
}


/* ================= ADD DATA ================= */

function addData() {
  const monthValue = document.getElementById("month").value;
  const revenue    = parseFloat(document.getElementById("revenue").value);
  const expenses   = parseFloat(document.getElementById("expenses").value);

  if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
    alert("Enter valid revenue and expense data.");
    return;
  }

  const date   = new Date(monthValue + "-01");
  const profit = revenue - expenses;

  businessData.push({ date, revenue, expenses, profit });
  businessData.sort((a, b) => a.date - b.date);

  updateAll();
}


/* ================= MASTER UPDATE ================= */

function updateAll() {
  renderRecordsTable();
  updateProgressIndicator();
  renderCoreCharts();
  renderAIInsights();

  if (businessData.length >= 3) {
    renderPerformanceMatrix();
    renderRiskAssessment();
  }
}


/* ================= RECORD TABLE ================= */

function renderRecordsTable() {
  const tbody = document.getElementById("recordsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (businessData.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:28px;font-family:'JetBrains Mono',monospace;font-size:12px;">No records yet — add your first month above</td></tr>`;
    return;
  }

  businessData.forEach(record => {
    const profitColor = record.profit >= 0 ? "var(--success)" : "var(--danger)";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${record.date.toISOString().slice(0, 7)}</td>
      <td>${formatCurrency(record.revenue)}</td>
      <td>${formatCurrency(record.expenses)}</td>
      <td style="color:${profitColor};font-weight:600;">${formatCurrency(record.profit)}</td>
    `;
    tbody.appendChild(row);
  });
}


/* ================= DATA PROGRESS ================= */

function updateProgressIndicator() {
  const progress = document.getElementById("dataProgress");
  if (!progress) return;

  const count = businessData.length;

  if (count < 3) {
    progress.innerHTML = `${count} / 3 months entered &nbsp;·&nbsp; Add ${3 - count} more month${3 - count !== 1 ? "s" : ""} to activate ImpactGrid Insights`;
  } else {
    progress.innerHTML = `<span style="color:var(--success);">●</span> &nbsp;${count} months recorded &nbsp;·&nbsp; <strong style="color:var(--gold-light);">ImpactGrid Insights Active</strong>`;
  }
}


/* ================= CORE CHARTS ================= */

function renderCoreCharts() {
  const labels = businessData.map(d => d.date.toISOString().slice(0, 7));

  revenueChart?.destroy();
  profitChart?.destroy();
  expenseChart?.destroy();

  const goldColor      = "rgba(200,169,110,0.9)";
  const goldFill       = "rgba(200,169,110,0.08)";
  const successColor   = "rgba(45,212,160,0.9)";
  const successFill    = "rgba(45,212,160,0.08)";
  const dangerColor    = "rgba(255,77,109,0.9)";
  const dangerFill     = "rgba(255,77,109,0.08)";

  revenueChart = createStyledChart("revenueChart", "line", labels,
    businessData.map(d => d.revenue), "Revenue", goldColor, goldFill);

  profitChart = createStyledChart("profitChart", "line", labels,
    businessData.map(d => d.profit), "Profit / Loss", successColor, successFill);

  expenseChart = createStyledChart("expenseChart", "bar", labels,
    businessData.map(d => d.expenses), "Expenses", dangerColor, dangerFill);
}

function createStyledChart(id, type, labels, data, label, color, fillColor) {
  const canvas = document.getElementById(id);
  if (!canvas) return null;

  const isBar = type === "bar";

  return new Chart(canvas, {
    type,
    data: {
      labels,
      datasets: [{
        label,
        data,
        borderColor: color,
        backgroundColor: isBar ? color.replace("0.9", "0.7") : fillColor,
        borderWidth: isBar ? 0 : 2,
        pointBackgroundColor: color,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: !isBar,
        borderRadius: isBar ? 6 : 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: "rgba(122,139,168,0.9)",
            font: { family: "'JetBrains Mono', monospace", size: 11 }
          }
        },
        tooltip: {
          backgroundColor: "#121729",
          borderColor: "#222b42",
          borderWidth: 1,
          titleColor: "#edf0f7",
          bodyColor: "#7a8ba8",
          titleFont: { family: "'Manrope', sans-serif", weight: "600" },
          bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
          padding: 12,
          callbacks: {
            label: ctx => ` ${formatCurrency(ctx.raw)}`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: "#3d4e68",
            font: { family: "'JetBrains Mono', monospace", size: 10 }
          },
          grid: { color: "rgba(26,32,53,0.8)" }
        },
        y: {
          ticks: {
            color: "#3d4e68",
            font: { family: "'JetBrains Mono', monospace", size: 10 },
            callback: val => formatCurrency(val)
          },
          grid: { color: "rgba(26,32,53,0.8)" }
        }
      }
    }
  });
}


/* ================= AI FORECAST ENGINE ================= */

function generateAIProjection(years) {
  if (businessData.length < 3) return;

  const canvas      = document.getElementById("aiForecastChart");
  const explanation = document.getElementById("aiForecastExplanation");
  if (!canvas) return;

  if (aiForecastChart) aiForecastChart.destroy();

  const growthRates = [];
  for (let i = 1; i < businessData.length; i++) {
    if (businessData[i - 1].revenue > 0) {
      growthRates.push(
        (businessData[i].revenue - businessData[i - 1].revenue) / businessData[i - 1].revenue
      );
    }
  }

  const avgGrowth = growthRates.length > 0
    ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
    : 0;

  let revenue = businessData[businessData.length - 1].revenue;
  const labels = [], data = [], optimistic = [], conservative = [];

  for (let i = 1; i <= years; i++) {
    revenue = revenue * Math.pow(1 + avgGrowth, 12);
    const base = Math.max(0, Math.round(revenue));
    labels.push("Year " + i);
    data.push(base);
    optimistic.push(Math.round(base * 1.15));
    conservative.push(Math.round(base * 0.85));
  }

  aiForecastChart = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Optimistic (+15%)",
          data: optimistic,
          borderColor: "rgba(45,212,160,0.5)",
          backgroundColor: "rgba(45,212,160,0.04)",
          borderDash: [4, 4],
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          borderWidth: 1.5,
        },
        {
          label: "Base Projection",
          data,
          borderColor: "rgba(200,169,110,1)",
          backgroundColor: "rgba(200,169,110,0.06)",
          tension: 0.4,
          fill: true,
          pointBackgroundColor: "rgba(200,169,110,1)",
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 2.5,
        },
        {
          label: "Conservative (-15%)",
          data: conservative,
          borderColor: "rgba(255,77,109,0.5)",
          backgroundColor: "rgba(255,77,109,0.04)",
          borderDash: [4, 4],
          tension: 0.4,
          fill: false,
          pointRadius: 3,
          borderWidth: 1.5,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          labels: {
            color: "rgba(122,139,168,0.9)",
            font: { family: "'JetBrains Mono', monospace", size: 11 },
            boxWidth: 14,
            padding: 16
          }
        },
        tooltip: {
          backgroundColor: "#121729",
          borderColor: "#222b42",
          borderWidth: 1,
          titleColor: "#edf0f7",
          bodyColor: "#7a8ba8",
          titleFont: { family: "'Manrope', sans-serif", weight: "600" },
          bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
          padding: 12,
          callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}` }
        }
      },
      scales: {
        x: {
          ticks: { color: "#3d4e68", font: { family: "'JetBrains Mono', monospace", size: 11 } },
          grid: { color: "rgba(26,32,53,0.8)" }
        },
        y: {
          ticks: {
            color: "#3d4e68",
            font: { family: "'JetBrains Mono', monospace", size: 11 },
            callback: val => formatCurrency(val)
          },
          grid: { color: "rgba(26,32,53,0.8)" }
        }
      }
    }
  });

  if (explanation) {
    explanation.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-top:16px;">
        <div style="padding:14px 16px;background:var(--bg-mid);border:1px solid rgba(45,212,160,0.2);border-radius:var(--r-sm);">
          <div style="font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--success);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Optimistic</div>
          <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--success);">${formatCurrency(optimistic[optimistic.length-1])}</div>
        </div>
        <div style="padding:14px 16px;background:var(--bg-mid);border:1px solid rgba(200,169,110,0.2);border-radius:var(--r-sm);">
          <div style="font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--gold);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Base Projection</div>
          <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--gold-light);">${formatCurrency(data[data.length-1])}</div>
        </div>
        <div style="padding:14px 16px;background:var(--bg-mid);border:1px solid rgba(255,77,109,0.2);border-radius:var(--r-sm);">
          <div style="font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--danger);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Conservative</div>
          <div style="font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--danger);">${formatCurrency(conservative[conservative.length-1])}</div>
        </div>
      </div>
    `;
  }
}


/* ================= AI INSIGHTS ================= */

function renderAIInsights() {
  const aiInsightsSection = document.getElementById("aiInsights");
  if (!aiInsightsSection) return;

  if (businessData.length < 1) {
    aiInsightsSection.innerHTML = `<span style="color:var(--text-muted);font-family:'JetBrains Mono',monospace;font-size:12px;">Awaiting financial data — insights will appear once records are entered.</span>`;
    return;
  }

  const totalRevenue = sum("revenue");
  const totalProfit  = sum("profit");
  const margin       = getMargin();
  const growth       = calculateMonthlyGrowth();
  const volatility   = calculateVolatility();

  const anomalies = ImpactGridAI.detectAnomalies(businessData);
  const anomalyHTML = anomalies.length > 0
    ? `<p style="color:var(--warning);"><strong>⚠ Anomalies Detected:</strong> ${anomalies.map(a => a.date.toISOString().slice(0,7)).join(", ")} showed unusual revenue patterns.</p>`
    : "";

  const marginColor   = margin > 20 ? "var(--success)" : margin > 10 ? "var(--gold-light)" : "var(--danger)";
  const growthColor   = growth > 0  ? "var(--success)" : "var(--danger)";
  const volatilityColor = volatility < 15 ? "var(--success)" : volatility < 30 ? "var(--warning)" : "var(--danger)";

  // Store plain text version for PDF
  lastAIInsightText = `Total Revenue: ${formatCurrency(totalRevenue)} | Total Profit: ${formatCurrency(totalProfit)} | Profit Margin: ${margin.toFixed(2)}% | Growth: ${growth.toFixed(2)}% | Volatility: ${volatility.toFixed(2)}%`;

  aiInsightsSection.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
      ${metricTile("Total Revenue",  formatCurrency(totalRevenue), "var(--gold-light)")}
      ${metricTile("Total Profit",   formatCurrency(totalProfit),  totalProfit >= 0 ? "var(--success)" : "var(--danger)")}
      ${metricTile("Profit Margin",  margin.toFixed(2) + "%",      marginColor)}
      ${metricTile("Revenue Growth", growth.toFixed(2) + "%",      growthColor)}
      ${metricTile("Volatility",     volatility.toFixed(2) + "%",  volatilityColor)}
    </div>
    ${anomalyHTML ? `<div style="margin-top:14px;">${anomalyHTML}</div>` : ""}
  `;
}

function metricTile(label, value, color) {
  return `
    <div style="padding:14px 16px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--r-sm);">
      <div style="font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">${label}</div>
      <div style="font-family:'Syne',sans-serif;font-size:16px;font-weight:700;color:${color};">${value}</div>
    </div>
  `;
}


/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix() {

  const volatility  = calculateVolatility();
  const growth      = calculateMonthlyGrowth();
  const margin      = getMargin();

  // Normalise all scores cleanly to 0–100
  const stabilityScore = Math.min(100, Math.max(0, 100 - volatility));
  const growthScore    = Math.min(100, Math.max(0, Math.min(growth, 100)));
  const profitScore    = Math.min(100, Math.max(0, Math.min(margin * 2, 100)));

  performanceBarChart?.destroy();
  distributionPieChart?.destroy();

  // ── HORIZONTAL BAR CHART (Power BI style) ──
  performanceBarChart = new Chart(
    document.getElementById("performanceBarChart"),
    {
      type: "bar",
      data: {
        labels: ["Stability Index", "Growth Score", "Profit Score"],
        datasets: [
          {
            label: "Score",
            data: [stabilityScore, growthScore, profitScore],
            backgroundColor: [
              "rgba(45,212,160,0.85)",
              "rgba(200,169,110,0.85)",
              "rgba(61,127,255,0.85)"
            ],
            borderColor: [
              "rgba(45,212,160,1)",
              "rgba(200,169,110,1)",
              "rgba(61,127,255,1)"
            ],
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 28,
          },
          {
            label: "Remaining",
            data: [
              100 - stabilityScore,
              100 - growthScore,
              100 - profitScore
            ],
            backgroundColor: "rgba(26,32,53,0.5)",
            borderWidth: 0,
            borderRadius: 6,
            barThickness: 28,
          }
        ]
      },
      options: {
        indexAxis: "y",   // horizontal bars
        responsive: true,
        maintainAspectRatio: false,
        stacked: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#121729",
            borderColor: "#222b42",
            borderWidth: 1,
            titleColor: "#edf0f7",
            bodyColor: "#7a8ba8",
            titleFont: { family: "'Manrope', sans-serif", weight: "600" },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 11 },
            padding: 12,
            filter: item => item.datasetIndex === 0,
            callbacks: {
              label: ctx => ` Score: ${ctx.raw.toFixed(1)} / 100`
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            max: 100,
            ticks: {
              color: "#3d4e68",
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: val => val + "%"
            },
            grid: { color: "rgba(26,32,53,0.8)" }
          },
          y: {
            stacked: true,
            ticks: {
              color: "#7a8ba8",
              font: { family: "'Manrope', sans-serif", size: 12, weight: "600" }
            },
            grid: { display: false }
          }
        }
      }
    }
  );

  // ── GAUGE-STYLE DOUGHNUT — one per metric ──
  // Replace the single pie with 3 mini radial gauges using a custom HTML approach
  const pieCanvas = document.getElementById("distributionPieChart");
  if (pieCanvas) {
    // Replace canvas with styled gauge cards
    const container = pieCanvas.parentElement;
    pieCanvas.style.display = "none";

    const existing = container.querySelector(".gauge-grid");
    if (existing) existing.remove();

    const gaugeHTML = `
      <div class="gauge-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:8px 0;">
        ${gaugeCard("Stability", stabilityScore, "#2dd4a0")}
        ${gaugeCard("Growth",    growthScore,    "#c8a96e")}
        ${gaugeCard("Profit",    profitScore,    "#3d7fff")}
      </div>
    `;
    container.insertAdjacentHTML("beforeend", gaugeHTML);

    // Draw each SVG gauge
    drawGauge("gauge-stability", stabilityScore, "#2dd4a0");
    drawGauge("gauge-growth",    growthScore,    "#c8a96e");
    drawGauge("gauge-profit",    profitScore,    "#3d7fff");
  }

  // Health score
  const health = Math.min(100, Math.max(0, Math.round(
    (stabilityScore + growthScore + profitScore) / 3
  )));

  const healthColor = health >= 70 ? "var(--success)" : health >= 40 ? "var(--gold-light)" : "var(--danger)";
  const healthLabel = health >= 70 ? "Healthy" : health >= 40 ? "Moderate" : "At Risk";

  setText("businessHealthIndex", `
    <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
      <div style="padding:14px 22px;background:var(--bg-mid);border:1px solid ${healthColor.replace("var(--success)","rgba(45,212,160,0.3)").replace("var(--gold-light)","rgba(200,169,110,0.3)").replace("var(--danger)","rgba(255,77,109,0.3)")};border-radius:var(--r-sm);">
        <div style="font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--text-muted);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:4px;">Business Health Score</div>
        <div style="font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:${healthColor};line-height:1;">${health}<span style="font-size:14px;opacity:0.6;margin-left:2px;">/100</span></div>
        <div style="font-size:11px;font-family:'JetBrains Mono',monospace;color:${healthColor};margin-top:4px;letter-spacing:0.06em;">${healthLabel}</div>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);max-width:360px;line-height:1.6;">
        Composite score based on revenue stability, growth trajectory, and profit margin. Updated in real time as you add data.
      </div>
    </div>
  `);
}

function gaugeCard(label, score, color) {
  return `
    <div style="text-align:center;padding:12px 8px;background:var(--bg-mid);border:1px solid var(--border);border-radius:var(--r-md);">
      <canvas id="gauge-${label.toLowerCase()}" width="120" height="80" style="display:block;margin:0 auto;"></canvas>
      <div style="font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:${color};margin-top:4px;">${score.toFixed(0)}<span style="font-size:11px;opacity:0.5;">/100</span></div>
      <div style="font-size:10px;font-family:'JetBrains Mono',monospace;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;margin-top:2px;">${label}</div>
    </div>
  `;
}

function drawGauge(canvasId, value, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx   = canvas.getContext("2d");
  const w     = canvas.width;
  const h     = canvas.height;
  const cx    = w / 2;
  const cy    = h * 0.88;
  const r     = Math.min(w, h * 2) * 0.42;
  const start = Math.PI;
  const end   = 2 * Math.PI;

  ctx.clearRect(0, 0, w, h);

  // Track background
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.strokeStyle = "rgba(26,32,53,0.9)";
  ctx.lineWidth   = 12;
  ctx.lineCap     = "round";
  ctx.stroke();

  // Value arc
  const progress = start + (value / 100) * Math.PI;
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, progress);
  ctx.strokeStyle = color;
  ctx.lineWidth   = 12;
  ctx.lineCap     = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur  = 8;
  ctx.stroke();
  ctx.shadowBlur  = 0;
}


/* ================= RISK ================= */

function renderRiskAssessment() {
  const volatility = calculateVolatility();
  const margin     = getMargin();

  const stabilityLevel  = volatility > 30 ? "Elevated" : volatility > 15 ? "Moderate" : "Low";
  const marginLevel     = margin < 10 ? "Elevated" : margin < 20 ? "Moderate" : "Low";
  const liquidityLevel  = margin > 5  ? "Stable" : "Weak";

  const riskColor = level => level === "Low" || level === "Stable" ? "var(--success)" : level === "Moderate" ? "var(--warning)" : "var(--danger)";

  setText("stabilityRisk",  `<span style="color:${riskColor(stabilityLevel)};font-weight:700;">${stabilityLevel}</span><span style="color:var(--text-muted);font-size:12px;margin-left:10px;">Volatility: ${volatility.toFixed(1)}%</span>`);
  setText("marginRisk",     `<span style="color:${riskColor(marginLevel)};font-weight:700;">${marginLevel}</span><span style="color:var(--text-muted);font-size:12px;margin-left:10px;">Margin: ${margin.toFixed(1)}%</span>`);
  setText("liquidityRisk",  `<span style="color:${riskColor(liquidityLevel)};font-weight:700;">${liquidityLevel}</span>`);

  let insight = "Operational risk is currently within manageable bounds.";
  if (volatility > 30) insight  = "High revenue volatility indicates unstable income patterns — consider diversifying revenue streams.";
  if (margin < 10)     insight += " Profit margin is under pressure; a cost structure review is recommended.";
  if (volatility <= 15 && margin >= 20) insight = "Strong financial health detected. Revenue is stable and margins are healthy.";

  setText("riskInsight", insight);
}


/* ================= AI CHAT ================= */

async function askImpactGridAI() {
  const input  = document.getElementById("aiChatInput");
  const output = document.getElementById("aiChatOutput");
  if (!input || !output) return;

  const question = input.value.trim();
  if (question === "") return;

  output.innerHTML += `<div class="ai-user">${question}</div>`;
  input.value = "";
  output.scrollTop = output.scrollHeight;

  aiChatHistory.push({ role: "user", content: question });

  const typingId = "typing-" + Date.now();
  output.innerHTML += `<div class="ai-response" id="${typingId}"><span class="ai-typing">ImpactGrid AI is thinking<span class="dots">...</span></span></div>`;
  output.scrollTop = output.scrollHeight;

  const response = await ImpactGridAI.analyze(question, businessData, currentCurrency, aiChatHistory);

  document.getElementById(typingId)?.remove();

  output.innerHTML += `<div class="ai-response">${response}</div>`;
  output.scrollTop = output.scrollHeight;

  // Store last AI response as plain text for PDF
  const tmp = document.createElement("div");
  tmp.innerHTML = response;
  lastAIInsightText = tmp.innerText || tmp.textContent || lastAIInsightText;

  aiChatHistory.push({ role: "ai", content: question });
}

function fillAIChat(text) {
  const input = document.getElementById("aiChatInput");
  if (input) {
    input.value = text;
    input.focus();
    askImpactGridAI();
  }
}


/* ================= PDF ENGINE — BEAUTIFUL ================= */

function generatePDF() {
  if (businessData.length === 0) {
    alert("Add at least one month of data before generating a report.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const W  = 210;
  const margin = 18;
  const col2   = W / 2 + 4;

  /* ── HELPERS ── */
  const setFont = (size, style = "normal", color = [20, 30, 50]) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", style);
    doc.setTextColor(...color);
  };

  const rule = (y, opacity = 0.15) => {
    doc.setDrawColor(200, 169, 110);
    doc.setLineWidth(0.3);
    doc.setGState(new doc.GState({ opacity }));
    doc.line(margin, y, W - margin, y);
    doc.setGState(new doc.GState({ opacity: 1 }));
  };

  const box = (x, y, w, h, r = 3, fill = [14, 18, 32], stroke = [34, 43, 66]) => {
    doc.setFillColor(...fill);
    doc.setDrawColor(...stroke);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, w, h, r, r, "FD");
  };

  /* ── PAGE 1: COVER ── */

  // Dark header block
  doc.setFillColor(6, 8, 15);
  doc.rect(0, 0, W, 80, "F");

  // Gold top bar
  doc.setFillColor(200, 169, 110);
  doc.rect(0, 0, W, 1.5, "F");

  // Company name
  setFont(22, "bold", [226, 201, 138]);
  doc.text("ImpactGrid", margin, 28);

  setFont(10, "normal", [61, 78, 104]);
  doc.text("Financial Stability Engine  ·  IFSRM v3.0", margin, 36);

  // Divider
  doc.setDrawColor(200, 169, 110);
  doc.setLineWidth(0.5);
  doc.line(margin, 42, 80, 42);

  setFont(16, "bold", [237, 240, 247]);
  doc.text("Financial Intelligence Report", margin, 54);

  setFont(9, "normal", [61, 78, 104]);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, margin, 62);
  doc.text(`Currency: ${currentCurrency}  ·  Months on Record: ${businessData.length}`, margin, 69);

  // Business type badge
  const bType = document.getElementById("businessType")?.options[document.getElementById("businessType")?.selectedIndex]?.text || "SME";
  box(W - 70, 18, 52, 22, 4);
  setFont(7, "normal", [122, 139, 168]);
  doc.text("BUSINESS TYPE", W - 65, 26);
  setFont(9, "bold", [200, 169, 110]);
  doc.text(bType.toUpperCase(), W - 65, 33);

  /* ── SUMMARY METRICS CARDS ── */
  const totalRevenue  = sum("revenue");
  const totalExpenses = sum("expenses");
  const totalProfit   = sum("profit");
  const margin        = getMargin();
  const growth        = calculateMonthlyGrowth();
  const volatility    = calculateVolatility();
  const health        = Math.min(100, Math.max(0, Math.round(
    ((Math.max(0, 100 - volatility)) + Math.min(100, Math.max(0, Math.min(growth, 100))) + Math.min(100, Math.max(0, Math.min(margin * 2, 100)))) / 3
  )));

  let y = 92;
  setFont(8, "normal", [61, 78, 104]);
  doc.text("KEY FINANCIAL METRICS", margin, y);
  rule(y + 3);
  y += 10;

  const cards = [
    { label: "Total Revenue",  value: formatCurrency(totalRevenue),  color: [200, 169, 110] },
    { label: "Total Expenses", value: formatCurrency(totalExpenses), color: [255, 77, 109] },
    { label: "Net Profit",     value: formatCurrency(totalProfit),   color: totalProfit >= 0 ? [45, 212, 160] : [255, 77, 109] },
    { label: "Profit Margin",  value: margin.toFixed(1) + "%",       color: margin > 20 ? [45, 212, 160] : margin > 10 ? [200, 169, 110] : [255, 77, 109] },
    { label: "Revenue Growth", value: growth.toFixed(1) + "%",       color: growth >= 0 ? [45, 212, 160] : [255, 77, 109] },
    { label: "Health Score",   value: health + " / 100",             color: health >= 70 ? [45, 212, 160] : health >= 40 ? [200, 169, 110] : [255, 77, 109] },
  ];

  const cw = (W - margin * 2 - 10) / 3;
  cards.forEach((c, i) => {
    const cx = margin + (i % 3) * (cw + 5);
    const cy = y + Math.floor(i / 3) * 28;
    box(cx, cy, cw, 23, 3);
    setFont(7, "normal", [61, 78, 104]);
    doc.text(c.label.toUpperCase(), cx + 5, cy + 8);
    doc.setTextColor(...c.color);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(c.value, cx + 5, cy + 17);
  });

  y += 62;

  /* ── MONTHLY RECORDS TABLE ── */
  rule(y);
  y += 8;
  setFont(8, "normal", [61, 78, 104]);
  doc.text("MONTHLY FINANCIAL RECORDS", margin, y);
  y += 8;

  // Table header
  box(margin, y, W - margin * 2, 9, 2, [14, 18, 32], [34, 43, 66]);
  const cols = [margin + 3, margin + 42, margin + 88, margin + 134];
  const heads = ["MONTH", "REVENUE", "EXPENSES", "PROFIT / LOSS"];
  setFont(7, "bold", [122, 139, 168]);
  heads.forEach((h, i) => doc.text(h, cols[i], y + 6));
  y += 11;

  businessData.forEach((record, idx) => {
    if (y > 265) { doc.addPage(); addPageHeader(doc, W, margin); y = 30; }
    const rowFill = idx % 2 === 0 ? [10, 13, 24] : [14, 18, 32];
    box(margin, y, W - margin * 2, 8, 1, rowFill, [26, 32, 53]);

    const isProfit = record.profit >= 0;
    setFont(8, "normal", [180, 195, 215]);
    doc.text(record.date.toISOString().slice(0, 7),      cols[0], y + 5.5);
    doc.text(formatCurrency(record.revenue),             cols[1], y + 5.5);
    doc.text(formatCurrency(record.expenses),            cols[2], y + 5.5);
    doc.setTextColor(...(isProfit ? [45, 212, 160] : [255, 77, 109]));
    doc.setFont("helvetica", "bold");
    doc.text(formatCurrency(record.profit),              cols[3], y + 5.5);
    y += 9;
  });

  /* ── PAGE 2: AI INSIGHTS ── */
  doc.addPage();
  addPageHeader(doc, W, margin);
  y = 40;

  setFont(8, "normal", [61, 78, 104]);
  doc.text("IMPACTGRID AI — STRATEGIC INSIGHTS & ADVISORY", margin, y);
  rule(y + 3);
  y += 14;

  // AI insight box
  box(margin, y, W - margin * 2, 12, 3, [14, 18, 32]);
  doc.setFillColor(200, 169, 110);
  doc.roundedRect(margin, y, 2, 12, 1, 1, "F");
  setFont(8, "bold", [226, 201, 138]);
  doc.text("ImpactGrid AI Financial Analysis", margin + 6, y + 8);
  y += 18;

  // AI insight text (wrapped)
  const insightLines = doc.splitTextToSize(
    lastAIInsightText || buildPlainInsight(totalRevenue, totalProfit, margin, growth, volatility),
    W - margin * 2 - 4
  );

  insightLines.forEach(line => {
    if (y > 260) { doc.addPage(); addPageHeader(doc, W, margin); y = 30; }
    setFont(9, "normal", [180, 195, 215]);
    doc.text(line, margin, y);
    y += 5.5;
  });

  y += 8;
  rule(y);
  y += 10;

  /* ── RISK ASSESSMENT ── */
  setFont(8, "normal", [61, 78, 104]);
  doc.text("RISK ASSESSMENT", margin, y);
  y += 10;

  const risks = [
    { label: "Stability Risk", value: volatility > 30 ? "Elevated" : volatility > 15 ? "Moderate" : "Low", note: `Volatility: ${volatility.toFixed(1)}%` },
    { label: "Margin Risk",    value: margin < 10 ? "Elevated" : margin < 20 ? "Moderate" : "Low",         note: `Margin: ${margin.toFixed(1)}%` },
    { label: "Liquidity Risk", value: margin > 5 ? "Stable" : "Weak",                                      note: "" },
  ];

  risks.forEach(r => {
    const col = r.value === "Low" || r.value === "Stable" ? [45,212,160] : r.value === "Moderate" ? [245,166,35] : [255,77,109];
    box(margin, y, W - margin * 2, 14, 3);
    setFont(8, "normal", [122, 139, 168]);
    doc.text(r.label.toUpperCase(), margin + 5, y + 6);
    doc.setTextColor(...col);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(r.value, margin + 5, y + 12);
    if (r.note) {
      setFont(8, "normal", [61, 78, 104]);
      doc.text(r.note, margin + 45, y + 12);
    }
    y += 18;
  });

  y += 4;
  rule(y);
  y += 10;

  /* ── STRATEGIC RECOMMENDATIONS ── */
  setFont(8, "normal", [61, 78, 104]);
  doc.text("STRATEGIC RECOMMENDATIONS", margin, y);
  y += 10;

  const recs = buildRecommendations(margin, volatility, growth);
  recs.forEach(rec => {
    if (y > 265) { doc.addPage(); addPageHeader(doc, W, margin); y = 30; }
    box(margin, y, W - margin * 2, 14, 3);
    doc.setFillColor(200, 169, 110);
    doc.roundedRect(margin, y + 3, 2, 8, 1, 1, "F");
    setFont(8, "normal", [180, 195, 215]);
    const wrapped = doc.splitTextToSize(rec, W - margin * 2 - 12);
    doc.text(wrapped[0], margin + 6, y + 9);
    y += 18;
  });

  /* ── FOOTER on all pages ── */
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(6, 8, 15);
    doc.rect(0, 285, W, 12, "F");
    doc.setFillColor(200, 169, 110);
    doc.rect(0, 285, W, 0.5, "F");
    setFont(7, "normal", [61, 78, 104]);
    doc.text("© 2026 ImpactGrid Stability Engine  ·  IFSRM v3.0  ·  Confidential", margin, 291);
    doc.text(`Page ${i} of ${pageCount}`, W - margin - 16, 291);
  }

  doc.save(`ImpactGrid_Report_${new Date().toISOString().slice(0,10)}.pdf`);
}

function addPageHeader(doc, W, margin) {
  doc.setFillColor(6, 8, 15);
  doc.rect(0, 0, W, 22, "F");
  doc.setFillColor(200, 169, 110);
  doc.rect(0, 0, W, 1, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 169, 110);
  doc.text("ImpactGrid", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(61, 78, 104);
  doc.text("Financial Intelligence Report", margin + 24, 14);
}

function buildPlainInsight(rev, profit, margin, growth, vol) {
  const lines = [
    `Total Revenue: ${formatCurrency(rev)}. Net Profit: ${formatCurrency(profit)}.`,
    `Profit Margin: ${margin.toFixed(1)}%. Revenue Growth: ${growth.toFixed(1)}%. Revenue Volatility: ${vol.toFixed(1)}%.`,
  ];
  if (margin > 20) lines.push("Your business demonstrates strong profitability and efficient cost management.");
  else if (margin > 10) lines.push("Profitability is moderate. Focus on optimising operating costs to improve margins.");
  else lines.push("Profit margins are under pressure. A detailed review of the cost structure is strongly recommended.");
  if (vol > 30) lines.push("High revenue volatility detected. Introducing more predictable, recurring income streams would improve stability.");
  if (growth > 0) lines.push(`Revenue is growing at ${growth.toFixed(1)}%. Sustaining this trajectory will require disciplined financial management.`);
  return lines.join(" ");
}

function buildRecommendations(margin, volatility, growth) {
  const recs = [];
  if (margin < 10)    recs.push("Review your cost structure thoroughly. Margins below 10% indicate operational inefficiency or pricing challenges.");
  if (volatility > 30) recs.push("Introduce recurring revenue products or retainer agreements to reduce income volatility.");
  if (growth < 0)     recs.push("Revenue is declining. Identify your highest-performing periods and replicate the conditions that drove them.");
  if (margin > 20 && growth > 0) recs.push("Strong margins and positive growth — consider reinvesting profits into scaling operations or entering new markets.");
  if (recs.length === 0) recs.push("Continue scaling while maintaining financial discipline. Monitor margins and volatility each quarter.");
  return recs;
}


/* ================= HELPERS ================= */

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = val;
}

function calculateMonthlyGrowth() {
  if (businessData.length < 2) return 0;
  const first = businessData[0].revenue;
  const last  = businessData[businessData.length - 1].revenue;
  return first > 0 ? ((last - first) / first) * 100 : 0;
}

function calculateVolatility() {
  if (businessData.length < 2) return 0;
  const revenues = businessData.map(d => d.revenue);
  const mean     = revenues.reduce((a, b) => a + b, 0) / revenues.length;
  const variance = revenues.reduce((a, b) => a + (b - mean) ** 2, 0) / revenues.length;
  return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
}

function getMargin() {
  const revenue = sum("revenue");
  const profit  = sum("profit");
  return revenue > 0 ? (profit / revenue) * 100 : 0;
}

function sum(key) {
  return businessData.reduce((a, b) => a + (b[key] || 0), 0);
}


/* ================= NAV ================= */

function showSection(section, event) {
  document.querySelectorAll(".page-section")
    .forEach(s => s.classList.remove("active-section"));
  document.getElementById(section)?.classList.add("active-section");
  document.querySelectorAll(".sidebar li")
    .forEach(li => li.classList.remove("active"));
  if (event) event.target.closest("li").classList.add("active");
}


/* ================= SIDEBAR — fixed toggle ================= */

function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("collapsed");

  // When collapsed, show a small re-open tab on the edge
  let tab = document.getElementById("sidebar-reopen-tab");

  if (sidebar.classList.contains("collapsed")) {
    if (!tab) {
      tab = document.createElement("button");
      tab.id = "sidebar-reopen-tab";
      tab.innerHTML = "▶";
      tab.title = "Open sidebar";
      tab.style.cssText = `
        position:fixed;left:0;top:50%;transform:translateY(-50%);
        width:22px;height:48px;background:var(--bg-surface);
        border:1px solid var(--border-mid);border-left:none;
        border-radius:0 6px 6px 0;color:var(--gold);font-size:11px;
        cursor:pointer;z-index:999;transition:background 0.15s;
      `;
      tab.onmouseenter = () => tab.style.background = "var(--bg-elevated)";
      tab.onmouseleave = () => tab.style.background = "var(--bg-surface)";
      tab.onclick      = () => toggleSidebar();
      document.body.appendChild(tab);
    }
    tab.style.display = "flex";
    tab.style.alignItems = "center";
    tab.style.justifyContent = "center";
  } else {
    if (tab) tab.style.display = "none";
  }
}


/* ================= THEME ================= */

function toggleTheme() {
  document.body.classList.toggle("light-mode");
}


/* ================= LOGOUT ================= */

async function logout() {
  await window.supabaseClient?.auth.signOut();
  window.location.href = "login.html";
}


/* ================= GLOBAL ================= */

function bindGlobalFunctions() {
  window.addData              = addData;
  window.setCurrency          = setCurrency;
  window.showSection          = showSection;
  window.logout               = logout;
  window.askImpactGridAI      = askImpactGridAI;
  window.fillAIChat           = fillAIChat;
  window.toggleTheme          = toggleTheme;
  window.toggleSidebar        = toggleSidebar;
  window.generatePDF          = generatePDF;
  window.generateAIProjection = generateAIProjection;
}
