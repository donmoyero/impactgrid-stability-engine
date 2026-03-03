/* ================= GLOBAL STATE ================= */

let businessData = [];
let currentCurrency = "GBP";

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

/* ================= CURRENCY ================= */

function setCurrency(currency){
    currentCurrency = currency;
    updateAll();
}

function formatCurrency(val){
    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currentCurrency
    }).format(val);
}

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

    renderExecutiveSummary();
    renderLifecycle();
    renderCoreCharts();

    if (businessData.length >= 3) {
        renderFinancialStabilityAssessment();
        renderInsights();
        renderForecasts();
        renderPerformanceMatrix();
        renderRiskAssessment();
    } else {
        resetAdvancedSections();
    }
}

/* ================= RESET IF UNDER 3 MONTHS ================= */

function resetAdvancedSections() {

    setText("stabilityRegimeOutput", "Awaiting sufficient data...");
    setText("interactionSensitivityOutput", "—");
    setText("stabilityIndexOutput", "—");
    setText("stabilityInterpretation", "");
    setText("stabilityFocus", "");
    setText("stabilityOutlook", "");
    setText("insightEngine", "");
    setText("businessHealthIndex", "");
    setText("stabilityRisk", "");
    setText("marginRisk", "");
    setText("liquidityRisk", "");

    performanceBarChart?.destroy();
    distributionPieChart?.destroy();

    Object.keys(forecastCharts).forEach(key => {
        forecastCharts[key]?.destroy();
        delete forecastCharts[key];
    });
}

/* ================= EXECUTIVE SUMMARY ================= */

function renderExecutiveSummary() {

    if (businessData.length === 0) {
        setText("financialPositionSummary","No data entered yet.");
        return;
    }

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();
    const volatility = calculateVolatility();

    document.getElementById("financialPositionSummary").innerHTML = `
        <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
        <p>Net Profit: ${formatCurrency(totalProfit)}</p>
        <p>Profit Margin: ${margin.toFixed(2)}%</p>
        <p>Average Monthly Growth: ${growth.toFixed(2)}%</p>
        <p>Revenue Volatility: ${volatility.toFixed(2)}%</p>
    `;

    let status = "Stable Operating Position";
    if (volatility > 35) status = "Volatility Risk Exposure";
    else if (margin < 10) status = "Margin Compression Risk";
    else if (growth > 15) status = "Accelerated Growth Phase";

    setText("financialClassification", status);
    setText("executiveCommentary",
        "Financial structure evaluated across growth, margin and volatility dynamics."
    );
}

/* ================= LIFECYCLE ================= */

function renderLifecycle() {

    if (businessData.length < 3) {
        setText("lifecycleClassification","Enter at least 3 months for lifecycle analysis.");
        return;
    }

    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();

    let classification = "Stabilisation Phase";
    if (volatility > 35) classification = "At-Risk Phase";
    else if (growth > 10) classification = "Expansion Phase";
    else if (volatility < 15) classification = "Stable Phase";

    setText("lifecycleClassification",
        `<strong>Lifecycle Classification:</strong> ${classification}`
    );
}

/* ================= REMAINING ENGINE (UNCHANGED LOGIC) ================= */

/* All other functions remain exactly the same as your version */
/* renderInsights, renderFinancialStabilityAssessment, */
/* renderForecasts, generateProjection, renderPerformanceMatrix, */
/* renderRiskAssessment, renderCoreCharts, createChart, helpers, navigation */
