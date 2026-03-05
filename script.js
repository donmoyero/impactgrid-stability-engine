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
    return new Intl.NumberFormat(undefined,{
        style:'currency',
        currency:currentCurrency
    }).format(val);
}

/* ================= ADD DATA ================= */

function addData(){

    const monthValue=document.getElementById("month").value;
    const revenue=parseFloat(document.getElementById("revenue").value);
    const expenses=parseFloat(document.getElementById("expenses").value);

    if(!monthValue||isNaN(revenue)||isNaN(expenses)){
        alert("Enter valid revenue and expense data.");
        return;
    }

    const date=new Date(monthValue+"-01");
    const profit=revenue-expenses;

    const exists=businessData.find(d =>
        d.date.toISOString().slice(0,7) === date.toISOString().slice(0,7)
    );

    if(exists){
        alert("Data for this month already exists.");
        return;
    }

    businessData.push({date,revenue,expenses,profit});
    businessData.sort((a,b)=>a.date-b.date);

    updateAll();
}

/* ================= MASTER UPDATE ================= */

function updateAll(){

    if(businessData.length===0) return;

    renderRecordsTable();
    updateProgressIndicator();

    renderExecutiveSummary();
    renderLifecycle();
    renderCoreCharts();

    if(businessData.length>=3){

        renderFinancialStabilityAssessment();
        renderInsights();
        renderForecasts();
        renderPerformanceMatrix();
        renderRiskAssessment();
        renderAIInsights();   // AI ENGINE SAFE CALL

    }else{

        resetAdvancedSections();

    }
}

/* ================= RECORD TABLE ================= */

function renderRecordsTable(){

    const tbody=document.getElementById("recordsTableBody");
    if(!tbody) return;

    tbody.innerHTML="";

    businessData.forEach(record=>{

        const row=document.createElement("tr");

        const month=record.date.toISOString().slice(0,7);

        row.innerHTML=`
        <td>${month}</td>
        <td>${formatCurrency(record.revenue)}</td>
        <td>${formatCurrency(record.expenses)}</td>
        <td>${formatCurrency(record.profit)}</td>
        `;

        tbody.appendChild(row);

    });

}

/* ================= DATA PROGRESS ================= */

function updateProgressIndicator(){

    const progress=document.getElementById("dataProgress");
    if(!progress) return;

    const count=businessData.length;

    if(count<3){

        const remaining=3-count;

        progress.innerHTML=`
        ${count} / 3 months entered<br>
        Enter ${remaining} more month${remaining>1?"s":""} to activate ImpactGrid Insights.
        `;

    }else{

        progress.innerHTML=`
        ${count} months recorded<br>
        <strong>ImpactGrid Insights Activated</strong>
        `;

    }

}

/* ================= RESET IF <3 MONTHS ================= */

function resetAdvancedSections(){

    setText("stabilityRegimeOutput","Awaiting sufficient data...");
    setText("interactionSensitivityOutput","—");
    setText("stabilityIndexOutput","—");
    setText("insightEngine","");
    setText("businessHealthIndex","");
    setText("stabilityRisk","Awaiting data...");
    setText("marginRisk","");
    setText("liquidityRisk","");
    setText("riskInsight","");

    setText("aiFinancial","");
    setText("aiOperations","");
    setText("aiForecast","");
    setText("aiPerformance","");
    setText("aiRisk","");

    performanceBarChart?.destroy();
    distributionPieChart?.destroy();

    Object.keys(forecastCharts).forEach(key=>{
        forecastCharts[key]?.destroy();
        delete forecastCharts[key];
    });
}

/* ================= EXECUTIVE SUMMARY ================= */

function renderExecutiveSummary(){

    const container=document.getElementById("financialPositionSummary");
    const classificationEl=document.getElementById("financialClassification");
    const commentaryEl=document.getElementById("executiveCommentary");

    const totalRevenue=sum("revenue");
    const totalProfit=sum("profit");
    const margin=getMargin();
    const growth=calculateMonthlyGrowth();
    const volatility=calculateVolatility();

    container.innerHTML=`
        <p>Total Revenue: ${formatCurrency(totalRevenue)}</p>
        <p>Net Profit: ${formatCurrency(totalProfit)}</p>
        <p>Profit Margin: ${margin.toFixed(2)}%</p>
        <p>Average Monthly Growth: ${growth.toFixed(2)}%</p>
        <p>Revenue Volatility: ${volatility.toFixed(2)}%</p>
    `;

    let status="Stable Operating Position";

    if(volatility>35) status="Volatility Risk Exposure";
    else if(margin<10) status="Margin Compression Risk";
    else if(growth>15) status="Accelerated Growth Phase";

    classificationEl.innerHTML=status;

    commentaryEl.innerHTML=
    "Financial structure evaluated across growth, margin and volatility dynamics.";
}

/* ================= LIFECYCLE ================= */

function renderLifecycle(){

    const container=document.getElementById("lifecycleClassification");

    if(businessData.length<3){
        container.innerHTML="Enter at least 3 months for lifecycle analysis.";
        return;
    }

    const volatility=calculateVolatility();
    const growth=calculateMonthlyGrowth();

    let classification="Stabilisation Phase";

    if(volatility>35) classification="At-Risk Phase";
    else if(growth>10) classification="Expansion Phase";
    else if(volatility<15) classification="Stable Phase";

    container.innerHTML=`<strong>Lifecycle Classification:</strong> ${classification}`;
}

/* ================= IMPACTGRID AI ================= */

function renderAIInsights(){

    if(!document.getElementById("aiFinancial")) return;

    if(businessData.length<3){

        setText("aiFinancial","Enter at least 3 months of financial data to activate ImpactGrid AI.");
        setText("aiOperations","");
        setText("aiForecast","");
        setText("aiPerformance","");
        setText("aiRisk","");
        return;

    }

    const volatility = calculateVolatility();
    const margin = getMargin();
    const growth = calculateMonthlyGrowth();

    setText("aiFinancial",
    `Revenue performance indicates ${growth>10?"expanding":"stable"} financial momentum with a profit margin of ${margin.toFixed(1)}%.`);

    setText("aiOperations",
    volatility>30
    ? "Operational revenue patterns show volatility which may affect income stability."
    : "Operational revenue patterns appear relatively stable.");

    setText("aiForecast",
    growth>10
    ? "Forecast modelling suggests continued revenue expansion if current growth persists."
    : "Forecast modelling suggests moderate financial continuity based on current trends.");

    const healthScore=Math.round(
        (Math.max(0,100-volatility)+
        Math.min(Math.abs(growth)*5,100)+
        Math.min(margin*3,100))/3
    );

    setText("aiPerformance",
    `The Business Health Index currently scores approximately ${healthScore}/100 indicating overall operational stability.`);

    setText("aiRisk",
    volatility>35
    ? "Risk analysis highlights elevated volatility which may introduce financial uncertainty."
    : "Overall operational risk appears manageable under current financial conditions.");

}

/* ================= NAVIGATION ================= */

function showSection(sectionId,event){

    document.querySelectorAll(".page-section").forEach(sec =>
        sec.classList.remove("active-section")
    );

    document.getElementById(sectionId)?.classList.add("active-section");

    document.querySelectorAll(".sidebar li").forEach(li =>
        li.classList.remove("active")
    );

    if(event) event.target.classList.add("active");

    setTimeout(()=>{
        if(sectionId==="forecast") renderForecasts();
        if(sectionId==="matrix") renderPerformanceMatrix();
        if(sectionId==="risk") renderRiskAssessment();
        if(sectionId==="ai") renderAIInsights();
    },100);
}

/* ================= HELPERS ================= */

function setText(id,value){
    const el=document.getElementById(id);
    if(el) el.innerHTML=value;
}

function calculateMonthlyGrowth(){
    if(businessData.length<2) return 0;
    const first=businessData[0].revenue;
    const last=businessData[businessData.length-1].revenue;
    return ((last-first)/first)*100;
}

function calculateVolatility(){

    if(businessData.length<2) return 0;

    const revenues=businessData.map(d=>d.revenue);

    const mean=revenues.reduce((a,b)=>a+b,0)/revenues.length;

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

/* ================= LOGOUT ================= */

async function logout(){

    try{
        if(window.supabaseClient){
            await window.supabaseClient.auth.signOut();
        }
    }catch(err){
        console.error("Logout error:",err);
    }

    window.location.href="login.html";
}

/* ================= GLOBAL BINDING ================= */

function bindGlobalFunctions(){
    window.addData=addData;
    window.showSection=showSection;
    window.logout=logout;
    window.setCurrency=setCurrency;
}
