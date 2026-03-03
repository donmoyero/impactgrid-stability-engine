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

    if (businessData.length === 0) return;

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

/* ================= RESET ================= */

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

    if (performanceBarChart) performanceBarChart.destroy();
    if (distributionPieChart) distributionPieChart.destroy();

    Object.values(forecastCharts).forEach(chart => chart?.destroy());
}

/* ================= FORECAST ================= */

function renderForecasts() {

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

    const canvas = document.getElementById(id);
    if (!canvas) return;

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

    forecastCharts[id] = new Chart(canvas.getContext("2d"), {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Projected Revenue",
                data
            }]
        },
        options: { responsive:true, maintainAspectRatio:false }
    });
}

/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix() {

    const barCanvas = document.getElementById("performanceBarChart");
    const pieCanvas = document.getElementById("distributionPieChart");
    if (!barCanvas || !pieCanvas) return;

    performanceBarChart?.destroy();
    distributionPieChart?.destroy();

    const volatility = calculateVolatility();
    const growth = calculateMonthlyGrowth();
    const margin = getMargin();

    const stabilityScore = Math.max(0, 100 - volatility);
    const growthScore = Math.min(Math.abs(growth)*5,100);
    const profitabilityScore = Math.min(margin*3,100);

    performanceBarChart = new Chart(barCanvas.getContext("2d"),{
        type:"bar",
        data:{
            labels:["Stability","Growth","Profitability"],
            datasets:[{
                label:"Performance Score",
                data:[stabilityScore,growthScore,profitabilityScore]
            }]
        },
        options:{ scales:{ y:{ beginAtZero:true,max:100 } } }
    });

    distributionPieChart = new Chart(pieCanvas.getContext("2d"),{
        type:"pie",
        data:{
            labels:["Revenue","Expenses","Profit"],
            datasets:[{
                data:[
                    sum("revenue"),
                    sum("expenses"),
                    sum("profit")
                ]
            }]
        },
        options:{ responsive:true }
    });

    setText("businessHealthIndex",
        `Composite Index: ${Math.round((stabilityScore+growthScore+profitabilityScore)/3)} / 100`
    );
}

/* ================= RISK ================= */

function renderRiskAssessment() {

    const volatility = calculateVolatility();
    const margin = getMargin();

    setText("stabilityRisk", volatility > 35 ? "Elevated" : "Low");
    setText("marginRisk", margin < 8 ? "Elevated" : "Low");
    setText("liquidityRisk", margin > 5 ? "Stable" : "Constrained");
}

/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d => d.date.toISOString().slice(0,7));

    revenueChart = createChart("revenueChart","line",labels,businessData.map(d=>d.revenue),"Revenue");
    profitChart = createChart("profitChart","line",labels,businessData.map(d=>d.profit),"Profit");
    expenseChart = createChart("expenseChart","bar",labels,businessData.map(d=>d.expenses),"Expenses");
}

function createChart(id,type,labels,data,label){

    const canvas = document.getElementById(id);
    if (!canvas) return null;

    return new Chart(canvas.getContext("2d"),{
        type,
        data:{ labels, datasets:[{ label, data }] },
        options:{ responsive:true, maintainAspectRatio:false }
    });
}

/* ================= HELPERS ================= */

function setText(id, value){
    const el = document.getElementById(id);
    if (el) el.innerHTML = value;
}

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
    window.setCurrency = setCurrency;
}
