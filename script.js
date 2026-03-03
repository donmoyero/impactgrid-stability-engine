/* ================= GLOBAL STATE ================= */

let businessData = [];

let revenueChart = null;
let profitChart = null;
let expenseChart = null;

let forecastCharts = {};
let performanceBarChart = null;
let distributionPieChart = null;

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
    bindGlobalFunctions();
});

/* ================= ADD DATA ================= */

function addData() {

    const monthValue = document.getElementById("month").value;
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);

    if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
        alert("Enter valid revenue and expense data.");
        return;
    }

    const date = new Date(monthValue + "-01");
    const profit = revenue - expenses;

    const exists = businessData.find(d =>
        d.date.toISOString().slice(0,7) === date.toISOString().slice(0,7)
    );

    if (exists) {
        alert("Data for this month already exists.");
        return;
    }

    businessData.push({ date, revenue, expenses, profit });
    businessData.sort((a,b)=>a.date-b.date);

    updateAll();
}

/* ================= MASTER UPDATE ================= */

function updateAll() {

    if (businessData.length === 0) return;

    renderExecutiveSummary();
    renderLifecycle();
    renderCoreCharts();
    renderForecasts();
    renderPerformanceMatrix();
    renderRiskAssessment();

    if (businessData.length >= 2) {
        renderFinancialStabilityAssessment();
        renderInsights();
    }
}

/* ================= EXECUTIVE SUMMARY ================= */

function renderExecutiveSummary() {

    const container = document.getElementById("financialPositionSummary");
    const classificationEl = document.getElementById("financialClassification");
    const commentaryEl = document.getElementById("executiveCommentary");

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();
    const volatility = calculateVolatility();

    container.innerHTML = `
        <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
        <p>Net Profit: ${formatCurrency(totalProfit)}</p>
        <p>Profit Margin: ${margin.toFixed(2)}%</p>
        <p>Average Monthly Growth: ${growth.toFixed(2)}%</p>
        <p>Revenue Volatility: ${volatility.toFixed(2)}%</p>
    `;

    /* ---- STATUS ---- */

    let status = "Stable Operating Position";
    if (volatility > 35) status = "Volatility Risk Exposure";
    else if (margin < 10) status = "Margin Compression Risk";
    else if (growth > 15) status = "Accelerated Growth Phase";

    if (classificationEl) classificationEl.innerHTML = status;

    /* ---- COMMENTARY ---- */

    let commentary = "Financial structure appears balanced across revenue, margin and variability metrics.";

    if (volatility > 35)
        commentary = "Revenue variability is elevated, increasing earnings instability.";
    else if (margin < 10)
        commentary = "Margin resilience is below optimal threshold, increasing sensitivity to revenue shocks.";
    else if (growth > 15)
        commentary = "Growth acceleration is present; operational stability should be maintained during expansion.";

    if (commentaryEl) commentaryEl.innerHTML = commentary;
}

/* ================= INSIGHTS ================= */

function renderInsights() {

    const container = document.getElementById("insightEngine");
    if (!container) return;

    const volatility = calculateVolatility();
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();

    let insight = "Financial structure appears stable under current operating conditions.";

    if (volatility > 35)
        insight = "Revenue volatility is elevated and may reduce cash flow predictability.";
    else if (margin < 10)
        insight = "Low margin resilience detected. Cost structure optimisation recommended.";
    else if (growth > 15)
        insight = "Strong growth detected. Ensure margin discipline during scaling.";

    container.innerHTML = insight;
}

/* ================= STABILITY ENGINE ================= */

function renderFinancialStabilityAssessment() {

    const volatility = calculateVolatility();
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();

    let regime = "Structural Stability";
    if (volatility > 30 && margin < 10) regime = "Structural Fragility";
    else if (growth > 15 && margin > 10) regime = "Controlled Expansion";
    else if (volatility > 25) regime = "Financial Stress";

    const stabilityIndex = Math.max(0, Math.min(100,
        Math.round(100 - volatility + margin - Math.abs(growth)/2)
    ));

    document.getElementById("stabilityRegimeOutput").innerHTML = `<strong>${regime}</strong>`;
    document.getElementById("interactionSensitivityOutput").innerHTML = volatility.toFixed(2);
    document.getElementById("stabilityIndexOutput").innerHTML = `<strong>${stabilityIndex} / 100</strong>`;

    /* ---- ADD MISSING NARRATIVE ---- */

    const interpretationEl = document.getElementById("stabilityInterpretation");
    const focusEl = document.getElementById("stabilityFocus");
    const outlookEl = document.getElementById("stabilityOutlook");

    if (!interpretationEl || !focusEl || !outlookEl) return;

    if (regime === "Structural Fragility") {
        interpretationEl.innerHTML = "High interaction between volatility and weak margin structure.";
        focusEl.innerHTML = "Reinforce margin resilience and stabilise revenue streams immediately.";
        outlookEl.innerHTML = "Short-term instability risk remains elevated without corrective measures.";
    }
    else if (regime === "Financial Stress") {
        interpretationEl.innerHTML = "Elevated financial sensitivity to revenue fluctuations.";
        focusEl.innerHTML = "Improve cost control and strengthen recurring revenue.";
        outlookEl.innerHTML = "Moderate instability with potential recovery through discipline.";
    }
    else if (regime === "Controlled Expansion") {
        interpretationEl.innerHTML = "Growth supported by sufficient margin resilience.";
        focusEl.innerHTML = "Maintain margin discipline while scaling.";
        outlookEl.innerHTML = "Positive short-term outlook if volatility remains controlled.";
    }
    else {
        interpretationEl.innerHTML = "Low structural sensitivity across core financial drivers.";
        focusEl.innerHTML = "Maintain operational consistency.";
        outlookEl.innerHTML = "Stable short-term operating environment.";
    }
}

/* ================= REMAINING ORIGINAL CODE BELOW (UNCHANGED) ================= */
