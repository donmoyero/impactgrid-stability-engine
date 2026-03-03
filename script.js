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

/* ================= DATA VALIDATION ================= */

function hasMinimumData(months = 3) {
    return businessData.length >= months;
}

/* ================= ADD DATA ================= */

function addData() {

    const monthValue = document.getElementById("month")?.value;
    const revenue = parseFloat(document.getElementById("revenue")?.value);
    const expenses = parseFloat(document.getElementById("expenses")?.value);

    if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
        alert("Enter valid financial data.");
        return;
    }

    if (revenue < 0 || expenses < 0) {
        alert("Revenue and expenses must be positive values.");
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

    if (!businessData.length) return;

    renderExecutiveSummary();
    renderLifecycle();
    renderInsights();
    renderCoreCharts();

    if (hasMinimumData(3)) {
        renderForecasts();
        renderPerformanceMatrix();
        renderRiskAssessment();
        renderFinancialStabilityAssessment();
    } else {
        clearAdvancedSections();
        showSystemMessage("Minimum 3 months of financial data required for advanced modelling.");
    }
}

/* ================= SYSTEM MESSAGE ================= */

function showSystemMessage(message) {

    const regimeEl = document.getElementById("stabilityRegimeOutput");
    const healthEl = document.getElementById("businessHealthIndex");

    if (regimeEl) regimeEl.innerHTML = `<span style="color:#94a3b8;">${message}</span>`;
    if (healthEl) healthEl.innerHTML = message;
}

/* ================= CLEAR ADVANCED SECTIONS ================= */

function clearAdvancedSections() {

    const ids = [
        "interactionSensitivityOutput",
        "stabilityIndexOutput",
        "stabilityInterpretation",
        "stabilityFocus",
        "stabilityOutlook",
        "matrixInterpretation",
        "stabilityRisk",
        "marginRisk",
        "liquidityRisk"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = "—";
    });

    performanceBarChart?.destroy();
    distributionPieChart?.destroy();

    Object.keys(forecastCharts).forEach(key => {
        forecastCharts[key]?.destroy();
    });
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d =>
        d.date.toISOString().slice(0,7)
    );

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
        data:{ labels, datasets:[{ label, data, borderColor:color, backgroundColor:type==="bar"?color:"transparent", tension:0.4 }]},
        options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
    });
}

/* ================= LIFECYCLE ================= */

function getBusinessAgeMonths() {

    const startDateInput = document.getElementById("businessStartDate")?.value;
    const reportingDateInput = document.getElementById("reportingDate")?.value;

    if (!startDateInput || !reportingDateInput) return 0;

    const start = new Date(startDateInput);
    const end = new Date(reportingDateInput);

    return (end.getFullYear() - start.getFullYear()) * 12 +
           (end.getMonth() - start.getMonth());
}

function renderLifecycle() {

    const container = document.getElementById("lifecycleClassification");
    if (!container) return;

    if (!hasMinimumData(2)) {
        container.innerHTML = "Lifecycle classification requires minimum 2 months of data.";
        return;
    }

    const age = getBusinessAgeMonths();
    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();

    let classification = "Early Operational Stage";

    if (age > 60 && volatility < 20) classification = "Mature Operational Phase";
    else if (growth > 5 && volatility < 25) classification = "Expansion Phase";
    else if (volatility > 40) classification = "At-Risk Phase";
    else if (age > 24) classification = "Stabilisation Phase";

    container.innerHTML = `<strong>Lifecycle Classification:</strong> ${classification}`;
}

/* ================= EXECUTIVE SUMMARY ================= */

function renderExecutiveSummary() {

    const container = document.getElementById("financialPositionSummary");
    if (!container) return;

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();
    const volatility = calculateVolatility();
    const age = getBusinessAgeMonths();

    container.innerHTML = `
        <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
        <p>Net Profit: ${formatCurrency(totalProfit)}</p>
        <p>Profit Margin: ${margin.toFixed(2)}%</p>
        <p>Average Monthly Growth: ${growth.toFixed(2)}%</p>
        <p>Revenue Volatility: ${volatility.toFixed(2)}%</p>
        <p>Business Age: ${age} months</p>
    `;
}

/* ================= STABILITY ENGINE ================= */

function calculateStructuralStates() {

    return {
        volatility: calculateVolatility(),
        margin: getMargin(),
        growth: calculateMonthlyGrowth()
    };
}

function calculateInteractionSensitivity(states) {

    let iss = states.volatility;

    if (states.margin < 10) iss *= 1.5;
    if (states.margin > 20) iss *= 0.7;

    if (states.growth > 15 && states.margin < 10) iss += 15;
    if (states.growth < 0 && states.volatility > 25) iss += 10;

    return Math.max(0, Math.min(100, iss));
}

function determineStabilityRegime(states, iss) {

    if (states.volatility > 25 && states.margin < 10 && iss >= 60)
        return "Structural Fragility Regime";

    if (iss >= 40)
        return "Financial Stress Regime";

    if (states.growth > 15 && states.margin >= 10)
        return "Controlled Expansion Regime";

    return "Structural Stability Regime";
}

function calculateStabilityIndex(regime, iss) {

    let score = 100 - iss;

    if (regime === "Structural Fragility Regime") score -= 20;
    if (regime === "Financial Stress Regime") score -= 10;
    if (regime === "Controlled Expansion Regime") score += 5;
    if (regime === "Structural Stability Regime") score += 10;

    return Math.max(0, Math.min(100, Math.round(score)));
}

function renderFinancialStabilityAssessment() {

    const states = calculateStructuralStates();
    const iss = calculateInteractionSensitivity(states);
    const regime = determineStabilityRegime(states, iss);
    const index = calculateStabilityIndex(regime, iss);

    document.getElementById("stabilityRegimeOutput").innerHTML = `<strong>${regime}</strong>`;
    document.getElementById("interactionSensitivityOutput").innerHTML = `${iss.toFixed(2)} / 100`;
    document.getElementById("stabilityIndexOutput").innerHTML = `<strong>${index} / 100</strong>`;
}

/* ================= HELPERS ================= */

function calculateMonthlyGrowth() {
    if (businessData.length < 2) return 0;
    let rates = [];
    for (let i=1;i<businessData.length;i++){
        const prev=businessData[i-1].revenue;
        const curr=businessData[i].revenue;
        if(prev>0) rates.push((curr-prev)/prev);
    }
    if(!rates.length) return 0;
    return (rates.reduce((a,b)=>a+b,0)/rates.length)*100;
}

function calculateVolatility(){
    if (businessData.length < 2) return 0;
    const revenues=businessData.map(d=>d.revenue);
    const mean=revenues.reduce((a,b)=>a+b,0)/revenues.length;
    if(mean===0) return 0;
    const variance=revenues.reduce((a,b)=>a+Math.pow(b-mean,2),0)/revenues.length;
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
    document.getElementById(sectionId)?.classList.add("active-section");

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
