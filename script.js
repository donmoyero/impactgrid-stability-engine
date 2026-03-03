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

    if (!container) return;

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

    if (classificationEl) {
        let status = "Stable Operating Position";
        if (volatility > 35) status = "Volatility Risk Exposure";
        else if (margin < 10) status = "Margin Compression Risk";
        else if (growth > 15) status = "Accelerated Growth Phase";

        classificationEl.innerHTML = status;
    }

    if (commentaryEl) {
        let commentary = "Financial structure appears balanced across revenue, margin and variability metrics.";

        if (volatility > 35)
            commentary = "Revenue variability is elevated, increasing earnings instability.";
        else if (margin < 10)
            commentary = "Margin resilience is below optimal threshold, increasing structural sensitivity.";
        else if (growth > 15)
            commentary = "Growth acceleration detected; operational discipline must be maintained.";

        commentaryEl.innerHTML = commentary;
    }
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
        insight = "Low margin resilience detected. Cost optimisation recommended.";
    else if (growth > 15)
        insight = "Strong growth detected. Ensure margin discipline during expansion.";

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

    const regimeEl = document.getElementById("stabilityRegimeOutput");
    const sensitivityEl = document.getElementById("interactionSensitivityOutput");
    const indexEl = document.getElementById("stabilityIndexOutput");

    if (regimeEl) regimeEl.innerHTML = `<strong>${regime}</strong>`;
    if (sensitivityEl) sensitivityEl.innerHTML = volatility.toFixed(2);
    if (indexEl) indexEl.innerHTML = `<strong>${stabilityIndex} / 100</strong>`;

    const interpretationEl = document.getElementById("stabilityInterpretation");
    const focusEl = document.getElementById("stabilityFocus");
    const outlookEl = document.getElementById("stabilityOutlook");

    if (!interpretationEl || !focusEl || !outlookEl) return;

    if (regime === "Structural Fragility") {
        interpretationEl.innerHTML = "High interaction between volatility and weak margin structure.";
        focusEl.innerHTML = "Reinforce margin resilience and stabilise revenue streams.";
        outlookEl.innerHTML = "Short-term instability risk remains elevated.";
    }
    else if (regime === "Financial Stress") {
        interpretationEl.innerHTML = "Elevated financial sensitivity to revenue fluctuations.";
        focusEl.innerHTML = "Improve cost control and strengthen recurring revenue.";
        outlookEl.innerHTML = "Moderate instability with recovery potential.";
    }
    else if (regime === "Controlled Expansion") {
        interpretationEl.innerHTML = "Growth supported by sufficient margin resilience.";
        focusEl.innerHTML = "Maintain margin discipline while scaling.";
        outlookEl.innerHTML = "Positive short-term structural outlook.";
    }
    else {
        interpretationEl.innerHTML = "Low structural sensitivity across core financial drivers.";
        focusEl.innerHTML = "Maintain operational consistency.";
        outlookEl.innerHTML = "Stable short-term operating environment.";
    }
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d => d.date.toISOString().slice(0,7));

    revenueChart = createChart("revenueChart","line",labels,businessData.map(d=>d.revenue),"#22c55e","Revenue");
    profitChart = createChart("profitChart","line",labels,businessData.map(d=>d.profit),"#3b82f6","Profit");
    expenseChart = createChart("expenseChart","bar",labels,businessData.map(d=>d.expenses),"#ef4444","Expenses");
}

function createChart(id,type,labels,data,color,label){

    const canvas = document.getElementById(id);
    if (!canvas) return null;

    return new Chart(canvas.getContext("2d"),{
        type,
        data:{ labels, datasets:[{ label, data, borderColor:color, backgroundColor:type==="bar"?color:"transparent", tension:0.3 }]},
        options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
    });
}

/* ================= LIFECYCLE ================= */

function renderLifecycle() {

    const container = document.getElementById("lifecycleClassification");
    if (!container) return;

    if (businessData.length < 2) {
        container.innerHTML = "Enter at least 2 months for lifecycle analysis.";
        return;
    }

    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();

    let classification = "Stabilisation Phase";
    if (volatility > 35) classification = "At-Risk Phase";
    else if (growth > 10) classification = "Expansion Phase";
    else if (volatility < 15) classification = "Stable Phase";

    container.innerHTML = `<strong>Lifecycle Classification:</strong> ${classification}`;
}

/* ================= HELPERS ================= */

function calculateMonthlyGrowth() {
    if (businessData.length < 2) return 0;
    const first = businessData[0].revenue;
    const last = businessData[businessData.length - 1].revenue;
    return ((last - first) / first) * 100;
}

function calculateVolatility(){
    if (businessData.length < 2) return 0;
    const revenues = businessData.map(d=>d.revenue);
    const mean = revenues.reduce((a,b)=>a+b,0)/revenues.length;
    const variance = revenues.reduce((a,b)=>a+Math.pow(b-mean,2),0)/revenues.length;
    return (Math.sqrt(variance)/mean)*100;
}

function getMargin(){
    const totalRevenue=sum("revenue");
    const totalProfit=sum("profit");
    return totalRevenue>0?(totalProfit/totalRevenue)*100:0;
}

function sum(key){
    return businessData.reduce((a,b)=>a+(b[key]||0),0);
}

function formatCurrency(val){
    return "£"+Number(val).toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    });
}

/* ================= NAVIGATION ================= */

function showSection(sectionId, event) {
    document.querySelectorAll(".page-section").forEach(sec =>
        sec.classList.remove("active-section")
    );
    const target = document.getElementById(sectionId);
    if (target) target.classList.add("active-section");

    document.querySelectorAll(".sidebar li").forEach(li =>
        li.classList.remove("active")
    );

    if (event) event.target.classList.add("active");
}

function logout() {
    location.reload();
}

function bindGlobalFunctions(){
    window.addData = addData;
    window.showSection = showSection;
    window.logout = logout;
}
