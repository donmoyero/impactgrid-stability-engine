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

/* ================= ADD DATA (REFINED INPUT LOGIC) ================= */

function addData() {

    const monthInput = document.getElementById("month");
    const revenueInput = document.getElementById("revenue");
    const expensesInput = document.getElementById("expenses");

    const monthValue = monthInput.value;
    const revenue = parseFloat(revenueInput.value);
    const expenses = parseFloat(expensesInput.value);

    /* ---- VALIDATION ---- */

    if (!monthValue) {
        alert("Please select a reporting month.");
        return;
    }

    if (isNaN(revenue) || revenue < 0) {
        alert("Enter a valid revenue amount.");
        return;
    }

    if (isNaN(expenses) || expenses < 0) {
        alert("Enter a valid expense amount.");
        return;
    }

    const date = new Date(monthValue + "-01");
    const today = new Date();

    // Prevent future month entry
    if (date > today) {
        alert("You cannot enter financial data for a future month.");
        return;
    }

    // Prevent duplicate month
    const exists = businessData.find(d =>
        d.date.toISOString().slice(0,7) === date.toISOString().slice(0,7)
    );

    if (exists) {
        alert("Data for this month already exists.");
        return;
    }

    const profit = revenue - expenses;

    businessData.push({ date, revenue, expenses, profit });
    businessData.sort((a,b)=>a.date-b.date);

    // Clear inputs after adding
    revenueInput.value = "";
    expensesInput.value = "";

    updateAll();
}

/* ================= MASTER UPDATE ================= */

function updateAll() {

    if (businessData.length === 0) return;

    renderExecutiveSummary();
    renderLifecycle();
    renderInsights();
    renderCoreCharts();
    renderForecasts();
    renderPerformanceMatrix();
    renderRiskAssessment();

    if (businessData.length >= 2) {
        renderFinancialStabilityAssessment();
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

    let status = "Stable Operating Position";

    if (volatility > 35) status = "Volatility Risk Exposure";
    else if (margin < 10) status = "Margin Compression Risk";
    else if (growth > 15) status = "Accelerated Growth Phase";

    classificationEl.innerHTML = status;

    let commentary = "Financial structure appears balanced across revenue, margin and variability metrics.";

    if (volatility > 35)
        commentary = "Revenue variability is elevated, reducing earnings predictability.";
    else if (margin < 10)
        commentary = "Margin resilience is below optimal threshold.";
    else if (growth > 15)
        commentary = "Growth acceleration detected. Ensure operational stability keeps pace.";

    commentaryEl.innerHTML = commentary;
}

/* ================= INSIGHTS ================= */

function renderInsights() {

    const container = document.getElementById("insightEngine");

    if (businessData.length < 2) {
        container.innerHTML = "Enter at least 2 months for insight generation.";
        return;
    }

    const volatility = calculateVolatility();
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();

    let insight = "Financial structure appears stable under current operating conditions.";

    if (volatility > 35)
        insight = "Revenue volatility is elevated. Cash flow predictability may be unstable.";
    else if (margin < 10)
        insight = "Margin resilience is weak. Cost review recommended.";
    else if (growth > 15)
        insight = "Growth acceleration detected. Monitor capacity and cash discipline.";

    container.innerHTML = insight;
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

/* ================= FORECAST ================= */

function renderForecasts() {

    if (businessData.length < 2) return;

    const first = businessData[0];
    const last = businessData[businessData.length - 1];

    const monthsDiff =
        (last.date.getFullYear() - first.date.getFullYear()) * 12 +
        (last.date.getMonth() - first.date.getMonth());

    if (monthsDiff <= 0 || first.revenue <= 0) return;

    const cagr = Math.pow(last.revenue / first.revenue, 1 / monthsDiff) - 1;

    generateProjection("forecast6m", 6, cagr);
    generateProjection("forecast1y", 12, cagr);
    generateProjection("forecast3y", 36, cagr);
    generateProjection("forecast5y", 60, cagr);
}

function generateProjection(id, months, cagr) {

    forecastCharts[id]?.destroy();

    const last = businessData[businessData.length - 1];
    let revenue = last.revenue;
    let date = new Date(last.date);

    let labels = [];
    let data = [];

    for (let i = 1; i <= months; i++) {
        revenue *= (1 + cagr);
        date.setMonth(date.getMonth() + 1);
        labels.push(date.toISOString().slice(0,7));
        data.push(Math.round(revenue));
    }

    const canvas = document.getElementById(id);
    if (!canvas) return;

    forecastCharts[id] = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: { labels, datasets: [{ label: "Projected Revenue", data, borderColor:"#f59e0b", tension:0.3 }]},
        options: { responsive:true, maintainAspectRatio:false }
    });
}

/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix() {

    if (businessData.length < 2) return;

    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();
    const margin = getMargin();

    const stabilityScore = Math.max(0, 100 - volatility);
    const growthScore = Math.min(Math.abs(growth)*5,100);
    const profitabilityScore = Math.min(margin*3,100);

    performanceBarChart?.destroy();

    performanceBarChart = new Chart(
        document.getElementById("performanceBarChart").getContext("2d"),
        {
            type:"bar",
            data:{
                labels:["Stability","Growth","Profitability"],
                datasets:[{
                    data:[stabilityScore,growthScore,profitabilityScore],
                    backgroundColor:["#22c55e","#f59e0b","#8b5cf6"]
                }]
            },
            options:{ scales:{ y:{ beginAtZero:true,max:100 } } }
        }
    );

    document.getElementById("businessHealthIndex").innerHTML =
        `Composite Index: ${Math.round((stabilityScore+growthScore+profitabilityScore)/3)} / 100`;
}

/* ================= RISK ================= */

function renderRiskAssessment() {

    const volatility = calculateVolatility();
    const margin = getMargin();

    document.getElementById("stabilityRisk").innerHTML =
        volatility > 35 ? "Elevated" : "Low";

    document.getElementById("marginRisk").innerHTML =
        margin < 8 ? "Elevated" : "Low";

    document.getElementById("liquidityRisk").innerHTML =
        margin > 5 ? "Stable" : "Constrained";
}

/* ================= STABILITY ENGINE ================= */

function renderFinancialStabilityAssessment() {

    const volatility = calculateVolatility();
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();

    let regime = "Structural Stability";

    if (volatility > 30 && margin < 10)
        regime = "Structural Fragility";
    else if (growth > 15 && margin > 10)
        regime = "Controlled Expansion";
    else if (volatility > 25)
        regime = "Financial Stress";

    const stabilityIndex = Math.max(0, Math.min(100,
        Math.round(100 - volatility + margin - Math.abs(growth)/2)
    ));

    document.getElementById("stabilityRegimeOutput").innerHTML = `<strong>${regime}</strong>`;
    document.getElementById("interactionSensitivityOutput").innerHTML = volatility.toFixed(2);
    document.getElementById("stabilityIndexOutput").innerHTML = `<strong>${stabilityIndex} / 100</strong>`;
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
    document.getElementById(sectionId).classList.add("active-section");

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
