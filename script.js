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

        renderInsights();
        renderForecasts();
        renderPerformanceMatrix();
        renderRiskAssessment();
        renderAIInsights();

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

/* ================= EXECUTIVE SUMMARY ================= */

function renderExecutiveSummary(){

    const container=document.getElementById("financialPositionSummary");
    if(!container) return;

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
}

/* ================= LIFECYCLE ================= */

function renderLifecycle(){

    const container=document.getElementById("lifecycleClassification");
    if(!container) return;

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

/* ================= CORE CHARTS ================= */

function renderCoreCharts(){

    if(!document.getElementById("revenueChart")) return;

    revenueChart?.destroy();
    profitChart?.destroy();
    expenseChart?.destroy();

    const labels = businessData.map(d=>d.date.toISOString().slice(0,7));

    revenueChart=createChart("revenueChart","line",labels,businessData.map(d=>d.revenue),"Revenue");
    profitChart=createChart("profitChart","line",labels,businessData.map(d=>d.profit),"Profit");
    expenseChart=createChart("expenseChart","bar",labels,businessData.map(d=>d.expenses),"Expenses");
}

function createChart(id,type,labels,data,label){

    const canvas=document.getElementById(id);
    if(!canvas) return null;

    return new Chart(canvas,{
        type:type,
        data:{
            labels:labels,
            datasets:[{
                label:label,
                data:data
            }]
        },
        options:{
            responsive:true,
            maintainAspectRatio:false
        }
    });
}

/* ================= FORECAST ================= */

function renderForecasts(){

    if(businessData.length<3) return;

    const first=businessData[0];
    const last=businessData[businessData.length-1];

    const monthsDiff=
        (last.date.getFullYear()-first.date.getFullYear())*12+
        (last.date.getMonth()-first.date.getMonth());

    if(monthsDiff<=0||first.revenue<=0) return;

    const cagr=Math.pow(last.revenue/first.revenue,1/monthsDiff)-1;

    generateProjection("forecast6m",6,cagr);
    generateProjection("forecast1y",12,cagr);
    generateProjection("forecast3y",36,cagr);
    generateProjection("forecast5y",60,cagr);
}

function generateProjection(id,months,cagr){

    const canvas=document.getElementById(id);
    if(!canvas) return;

    forecastCharts[id]?.destroy();

    const last=businessData[businessData.length-1];

    let revenue=last.revenue;
    let date=new Date(last.date);

    let labels=[];
    let data=[];

    for(let i=1;i<=months;i++){

        revenue*=(1+cagr);
        date.setMonth(date.getMonth()+1);

        labels.push(date.toISOString().slice(0,7));
        data.push(Math.round(revenue));

    }

    forecastCharts[id]=new Chart(canvas,{
        type:"line",
        data:{labels,datasets:[{label:"Projected Revenue",data}]},
        options:{responsive:true,maintainAspectRatio:false}
    });
}

/* ================= PERFORMANCE MATRIX ================= */

function renderPerformanceMatrix(){

    if(businessData.length<3) return;

    const volatility=calculateVolatility();
    const growth=calculateMonthlyGrowth();
    const margin=getMargin();

    const stabilityScore=Math.max(0,100-volatility);
    const growthScore=Math.min(Math.abs(growth)*5,100);
    const profitabilityScore=Math.min(margin*3,100);

    performanceBarChart?.destroy();
    distributionPieChart?.destroy();

    const barCanvas=document.getElementById("performanceBarChart");
    const pieCanvas=document.getElementById("distributionPieChart");

    if(barCanvas){
        performanceBarChart=new Chart(barCanvas,{
            type:"bar",
            data:{
                labels:["Stability","Growth","Profitability"],
                datasets:[{data:[stabilityScore,growthScore,profitabilityScore]}]
            },
            options:{scales:{y:{beginAtZero:true,max:100}}}
        });
    }

    if(pieCanvas){
        distributionPieChart=new Chart(pieCanvas,{
            type:"doughnut",
            data:{
                labels:["Stability","Growth","Profitability"],
                datasets:[{data:[stabilityScore,growthScore,profitabilityScore]}]
            }
        });
    }

    setText(
        "businessHealthIndex",
        `Composite Index: ${Math.round((stabilityScore+growthScore+profitabilityScore)/3)} / 100`
    );
}

/* ================= RISK ================= */

function renderRiskAssessment(){

    if(businessData.length<3) return;

    const volatility=calculateVolatility();
    const margin=getMargin();
    const growth=calculateMonthlyGrowth();

    const stability=volatility>35?"Elevated":"Low";
    const marginStatus=margin<8?"Elevated":"Low";
    const liquidity=margin>5?"Stable":"Constrained";

    setText("stabilityRisk",stability);
    setText("marginRisk",marginStatus);
    setText("liquidityRisk",liquidity);

    let insight="Operational risk currently appears manageable.";

    if(volatility>35){
        insight="Revenue volatility indicates fluctuating income patterns.";
    }

    if(margin<8){
        insight+=" Profit margins are compressed.";
    }

    if(growth>12){
        insight+=" Revenue growth remains strong.";
    }

    setText("riskInsight", insight);
}

/* ================= AI ================= */

function renderAIInsights(){

    if(!document.getElementById("aiFinancial")) return;
    if(businessData.length<3) return;

    const volatility=calculateVolatility();
    const margin=getMargin();
    const growth=calculateMonthlyGrowth();

    setText("aiFinancial",
    `Revenue momentum appears ${growth>10?"expansionary":"stable"} with a margin of ${margin.toFixed(1)}%.`);

    setText("aiOperations",
    volatility>30
    ?"Operational revenue volatility detected."
    :"Operational patterns appear stable.");

    setText("aiForecast",
    growth>10
    ?"Forecast suggests expansion if trend persists."
    :"Forecast suggests moderate continuity.");

    const score=Math.round((Math.max(0,100-volatility)+Math.min(Math.abs(growth)*5,100)+Math.min(margin*3,100))/3);

    setText("aiPerformance",`Business Health Index estimated at ${score}/100.`);

    setText("aiRisk",
    volatility>35
    ?"Volatility risk elevated."
    :"Operational risk currently manageable.");
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
