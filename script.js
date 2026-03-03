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

    renderCoreCharts();

    if (businessData.length >= 3) {
        renderForecasts();
        renderPerformanceMatrix();
        renderRiskAssessment();
    } else {
        resetAdvancedSections();
    }
}

/* ================= RESET ================= */

function resetAdvancedSections() {

    performanceBarChart?.destroy();
    distributionPieChart?.destroy();

    Object.keys(forecastCharts).forEach(key => {
        forecastCharts[key]?.destroy();
        delete forecastCharts[key];
    });
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
    if (!canvas || typeof Chart === "undefined") return null;

    const maxValue = Math.max(...data);
    const suggestedMax = maxValue * 1.15;

    return new Chart(canvas,{
        type,
        data:{
            labels,
            datasets:[{
                label,
                data,
                tension: 0.3
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false,
            scales:{
                y:{
                    beginAtZero:true,
                    suggestedMax: suggestedMax
                }
            }
        }
    });
}

/* ================= FORECAST ================= */

function renderForecasts() {

    const first = businessData[0];
    const last = businessData[businessData.length - 1];

    const monthsDiff =
        (last.date.getFullYear() - first.date.getFullYear()) * 12 +
        (last.date.getMonth() - first.date.getMonth());

    if (monthsDiff <= 0 || first.revenue <= 0) return;

    const rawCagr = Math.pow(last.revenue / first.revenue, 1 / monthsDiff) - 1;

    // Cap extreme growth
    const cappedCagr = Math.max(Math.min(rawCagr, 0.15), -0.15);

    generateProjection("forecast6m", 6, cappedCagr);
    generateProjection("forecast1y", 12, cappedCagr);
    generateProjection("forecast3y", 36, cappedCagr);
    generateProjection("forecast5y", 60, cappedCagr);
}

function generateProjection(id, months, cagr) {

    const canvas = document.getElementById(id);
    if (!canvas || typeof Chart === "undefined") return;

    forecastCharts[id]?.destroy();

    const last = businessData[businessData.length - 1];
    let revenue = last.revenue;
    let date = new Date(last.date);

    let labels = [];
    let data = [];

    for (let i = 1; i <= months; i++) {

        // Dampened growth
        const dampening = 1 - (i / (months * 1.5));
        const adjustedGrowth = cagr * dampening;

        revenue *= (1 + adjustedGrowth);

        date.setMonth(date.getMonth() + 1);
        labels.push(date.toISOString().slice(0,7));
        data.push(Math.round(revenue));
    }

    const maxValue = Math.max(...data);
    const suggestedMax = maxValue * 1.1;

    forecastCharts[id] = new Chart(canvas,{
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Projected Revenue",
                data,
                tension: 0.3
            }]
        },
        options: {
            responsive:true,
            maintainAspectRatio:false,
            scales:{
                y:{
                    beginAtZero:true,
                    suggestedMax: suggestedMax
                }
            }
        }
    });
}

/* ================= HELPERS ================= */

function calculateVolatility(){
    if (businessData.length < 2) return 0;
    const revenues = businessData.map(d=>d.revenue);
    const mean = revenues.reduce((a,b)=>a+b,0)/revenues.length;
    const variance = revenues.reduce((a,b)=>a+Math.pow(b-mean,2),0)/revenues.length;
    return mean === 0 ? 0 : (Math.sqrt(variance)/mean)*100;
}

function sum(key){
    return businessData.reduce((a,b)=>a+(b[key]||0),0);
}

/* ================= NAVIGATION ================= */

function showSection(sectionId, event) {

    document.querySelectorAll(".page-section").forEach(sec =>
        sec.classList.remove("active-section")
    );

    const activeSection = document.getElementById(sectionId);
    activeSection?.classList.add("active-section");

    document.querySelectorAll(".sidebar li").forEach(li =>
        li.classList.remove("active")
    );

    if (event) event.target.classList.add("active");

    // Force chart resize after section switch
    setTimeout(() => {
        revenueChart?.resize();
        profitChart?.resize();
        expenseChart?.resize();
        Object.values(forecastCharts).forEach(chart => chart?.resize());
        performanceBarChart?.resize();
        distributionPieChart?.resize();
    }, 100);
}

function logout() {
    location.reload();
}

/* ================= GLOBAL BINDING ================= */

function bindGlobalFunctions(){
    window.addData = addData;
    window.showSection = showSection;
    window.logout = logout;
    window.setCurrency = setCurrency;
}
