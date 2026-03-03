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

/* ================= CHART FACTORY ================= */

function createChart(id,type,labels,data,color,label){

    const canvas = document.getElementById(id);
    if (!canvas) return null;

    return new Chart(canvas.getContext("2d"),{
        type,
        data:{ labels, datasets:[{ label, data, borderColor:color, backgroundColor:type==="bar"?color:"transparent", tension:0.3 }]},
        options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
    });
}

/* ================= EXECUTIVE SUMMARY ================= */

function renderExecutiveSummary() {

    const container = document.getElementById("financialPositionSummary");

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
}

/* ================= LIFECYCLE ================= */

function renderLifecycle() {

    const container = document.getElementById("lifecycleClassification");

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

    const barCanvas = document.getElementById("performanceBarChart");
    performanceBarChart = new Chart(barCanvas.getContext("2d"),{
        type:"bar",
        data:{
            labels:["Stability","Growth","Profitability"],
            datasets:[{
                data:[stabilityScore,growthScore,profitabilityScore],
                backgroundColor:["#22c55e","#f59e0b","#8b5cf6"]
            }]
        },
        options:{ scales:{ y:{ beginAtZero:true,max:100 } } }
    });

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
    if (volatility > 30 && margin < 10) regime = "Structural Fragility";
    else if (growth > 15 && margin > 10) regime = "Controlled Expansion";
    else if (volatility > 25) regime = "Financial Stress";

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
