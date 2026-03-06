/* ================= GLOBAL STATE ================= */

let businessData = [];
let currentCurrency = "GBP";

let revenueChart = null;
let profitChart = null;
let expenseChart = null;

let performanceBarChart = null;
let distributionPieChart = null;
let aiForecastChart = null;

let aiChatHistory = [];


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
    const revenue = parseFloat(document.getElementById("revenue").value);
    const expenses = parseFloat(document.getElementById("expenses").value);

    if (!monthValue || isNaN(revenue) || isNaN(expenses)) {
        alert("Enter valid revenue and expense data.");
        return;
    }

    const date = new Date(monthValue + "-01");
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

    businessData.forEach(record => {

        const row = document.createElement("tr");

        row.innerHTML = `
        <td>${record.date.toISOString().slice(0,7)}</td>
        <td>${formatCurrency(record.revenue)}</td>
        <td>${formatCurrency(record.expenses)}</td>
        <td>${formatCurrency(record.profit)}</td>
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

        progress.innerHTML =
        `${count} / 3 months entered<br>
        Enter ${3-count} more months to activate ImpactGrid Insights`;

    } else {

        progress.innerHTML =
        `${count} months recorded<br>
        <strong>ImpactGrid Insights Activated</strong>`;

    }

}


/* ================= CORE CHARTS ================= */

function renderCoreCharts() {

    const labels = businessData.map(d => d.date.toISOString().slice(0,7));

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    revenueChart = createChart("revenueChart","line",labels,businessData.map(d=>d.revenue),"Revenue");
    profitChart = createChart("profitChart","line",labels,businessData.map(d=>d.profit),"Profit");
    expenseChart = createChart("expenseChart","bar",labels,businessData.map(d=>d.expenses),"Expenses");

}

function createChart(id,type,labels,data,label){

    const canvas = document.getElementById(id);
    if(!canvas) return;

    return new Chart(canvas,{
        type,
        data:{
            labels,
            datasets:[{
                label,
                data,
                tension:0.3
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false
        }
    });

}


/* ================= AI INSIGHTS ================= */

function renderAIInsights(){

    const aiInsightsSection = document.getElementById("aiInsights");
    if(!aiInsightsSection) return;

    if(businessData.length < 1){

        aiInsightsSection.innerHTML =
        "Enter financial data to generate AI insights.";

        return;
    }

    const totalRevenue = sum("revenue");
    const totalProfit = sum("profit");
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();
    const volatility = calculateVolatility();

    aiInsightsSection.innerHTML = `
    <p><strong>Total Revenue:</strong> ${formatCurrency(totalRevenue)}</p>
    <p><strong>Total Profit:</strong> ${formatCurrency(totalProfit)}</p>
    <p><strong>Profit Margin:</strong> ${margin.toFixed(2)}%</p>
    <p><strong>Growth:</strong> ${growth.toFixed(2)}%</p>
    <p><strong>Volatility:</strong> ${volatility.toFixed(2)}%</p>
    <br>
    <strong>ImpactGrid AI Insight</strong><br><br>
    ${generateAIInsightText(margin,growth,volatility)}
    `;

}

function generateAIInsightText(margin,growth,volatility){

let insight="";

if(growth>15)
insight+="Revenue growth is strong indicating expansion potential.<br>";

if(growth<5)
insight+="Growth is slow suggesting the need for revenue strategy improvement.<br>";

if(margin<10)
insight+="Profit margins are low indicating cost pressure.<br>";

if(margin>20)
insight+="Profit margins are healthy showing efficient operations.<br>";

if(volatility>30)
insight+="Revenue volatility is high which increases operational risk.<br>";

if(volatility<15)
insight+="Revenue patterns appear stable with predictable income.<br>";

return insight;

}


/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix(){

const volatility = calculateVolatility();
const growth = calculateMonthlyGrowth();
const margin = getMargin();

const stability = 100 - volatility;
const growthScore = growth * 4;
const profitScore = margin * 3;

performanceBarChart?.destroy();
distributionPieChart?.destroy();

performanceBarChart = new Chart(
document.getElementById("performanceBarChart"),
{
type:"bar",
data:{
labels:["Stability","Growth","Profit"],
datasets:[{
data:[stability,growthScore,profitScore]
}]
},
options:{responsive:true}
});

distributionPieChart = new Chart(
document.getElementById("distributionPieChart"),
{
type:"doughnut",
data:{
labels:["Stability","Growth","Profit"],
datasets:[{
data:[stability,growthScore,profitScore]
}]
}
});

const health = Math.round((stability+growthScore+profitScore)/3);

setText("businessHealthIndex","Business Health Score: "+health+"/100");

}


/* ================= RISK ================= */

function renderRiskAssessment(){

const volatility = calculateVolatility();
const margin = getMargin();

setText("stabilityRisk",volatility>30?"Elevated":"Low");
setText("marginRisk",margin<10?"Elevated":"Low");
setText("liquidityRisk",margin>5?"Stable":"Weak");

let insight="Operational risk currently manageable.";

if(volatility>30)
insight="Revenue volatility indicates unstable income patterns.";

if(margin<10)
insight+=" Profit margin pressure detected.";

setText("riskInsight",insight);

}


/* ================= PDF ENGINE ================= */

function generatePDF(){

const { jsPDF } = window.jspdf;

const doc = new jsPDF();

doc.setFontSize(22);
doc.text("ImpactGrid Financial Report",20,20);

doc.setFontSize(12);

doc.text("Generated by ImpactGrid Stability Engine",20,30);

let y = 50;

doc.text("Financial Records:",20,y);

y += 10;

businessData.forEach(record => {

doc.text(
`${record.date.toISOString().slice(0,7)}  |  Revenue: ${formatCurrency(record.revenue)}  |  Expenses: ${formatCurrency(record.expenses)}  |  Profit: ${formatCurrency(record.profit)}`,
20,
y
);

y += 10;

});

y += 10;

const totalRevenue = sum("revenue");
const totalProfit = sum("profit");
const margin = getMargin();

doc.text(`Total Revenue: ${formatCurrency(totalRevenue)}`,20,y);
y+=10;

doc.text(`Total Profit: ${formatCurrency(totalProfit)}`,20,y);
y+=10;

doc.text(`Profit Margin: ${margin.toFixed(2)}%`,20,y);

doc.save("ImpactGrid_Report.pdf");

}


/* ================= HELPERS ================= */

function setText(id,val){

const el=document.getElementById(id);
if(el) el.innerHTML=val;

}

function calculateMonthlyGrowth(){

if(businessData.length<2) return 0;

const first=businessData[0].revenue;
const last=businessData[businessData.length-1].revenue;

return ((last-first)/first)*100;

}

function calculateVolatility(){

const revenues=businessData.map(d=>d.revenue);

const mean=revenues.reduce((a,b)=>a+b)/revenues.length;

const variance=revenues.reduce((a,b)=>a+(b-mean)**2,0)/revenues.length;

return (Math.sqrt(variance)/mean)*100;

}

function getMargin(){

const revenue=sum("revenue");
const profit=sum("profit");

return revenue>0?(profit/revenue)*100:0;

}

function sum(key){

return businessData.reduce((a,b)=>a+(b[key]||0),0);

}


/* ================= NAV ================= */

function showSection(section,event){

document.querySelectorAll(".page-section")
.forEach(s=>s.classList.remove("active-section"));

document.getElementById(section)?.classList.add("active-section");

document.querySelectorAll(".sidebar li")
.forEach(li=>li.classList.remove("active"));

if(event) event.target.classList.add("active");

}


/* ================= SIDEBAR ================= */

function toggleSidebar(){

document.getElementById("sidebar").classList.toggle("collapsed");

}


/* ================= THEME ================= */

function toggleTheme(){

document.body.classList.toggle("light-mode");

}


/* ================= LOGOUT ================= */

async function logout(){

await window.supabaseClient?.auth.signOut();
window.location.href="login.html";

}


/* ================= GLOBAL ================= */

function bindGlobalFunctions(){

window.addData = addData;
window.setCurrency = setCurrency;
window.showSection = showSection;
window.logout = logout;
window.askImpactGridAI = askImpactGridAI;
window.toggleTheme = toggleTheme;
window.toggleSidebar = toggleSidebar;
window.generatePDF = generatePDF;

}
