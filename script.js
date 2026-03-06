/* ================= GLOBAL STATE ================= */

let businessData=[];
let currentCurrency="GBP";

let revenueChart=null;
let profitChart=null;
let expenseChart=null;

let performanceBarChart=null;
let distributionPieChart=null;

let aiForecastChart=null;


/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded",()=>{
bindGlobalFunctions();
});


/* ================= CURRENCY ================= */

function setCurrency(currency){
currentCurrency=currency;
updateAll();
}

function formatCurrency(val){
return new Intl.NumberFormat(undefined,{
style:"currency",
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

businessData.push({date,revenue,expenses,profit});
businessData.sort((a,b)=>a.date-b.date);

updateAll();
}


/* ================= MASTER UPDATE ================= */

function updateAll(){

renderRecordsTable();
updateProgressIndicator();
renderCoreCharts();

if(businessData.length>=3){
renderPerformanceMatrix();
renderRiskAssessment();
}

}


/* ================= TABLE ================= */

function renderRecordsTable(){

const tbody=document.getElementById("recordsTableBody");
tbody.innerHTML="";

businessData.forEach(record=>{

const row=document.createElement("tr");

row.innerHTML=`
<td>${record.date.toISOString().slice(0,7)}</td>
<td>${formatCurrency(record.revenue)}</td>
<td>${formatCurrency(record.expenses)}</td>
<td>${formatCurrency(record.profit)}</td>
`;

tbody.appendChild(row);

});
}


/* ================= PROGRESS ================= */

function updateProgressIndicator(){

const progress=document.getElementById("dataProgress");

progress.innerHTML=`${businessData.length} months recorded`;

}


/* ================= CHARTS ================= */

function renderCoreCharts(){

const labels=businessData.map(d=>d.date.toISOString().slice(0,7));

revenueChart?.destroy();
profitChart?.destroy();
expenseChart?.destroy();

revenueChart=createChart("revenueChart","line",labels,businessData.map(d=>d.revenue),"Revenue");
profitChart=createChart("profitChart","line",labels,businessData.map(d=>d.profit),"Profit");
expenseChart=createChart("expenseChart","bar",labels,businessData.map(d=>d.expenses),"Expenses");

}

function createChart(id,type,labels,data,label){

const canvas=document.getElementById(id);

return new Chart(canvas,{
type,
data:{labels,datasets:[{label,data}]},
options:{responsive:true}
});

}


/* ================= AI CHAT ================= */

function askImpactGridAI(){

const input=document.getElementById("aiChatInput");
const output=document.getElementById("aiChatOutput");

const question=input.value.trim();
if(!question) return;

output.innerHTML+=`<div class="ai-user">${question}</div>`;

input.value="";

generateAIResponse(question,output);

}


function generateAIResponse(question,output){

const q=question.toLowerCase();

const projectionMatch=q.match(/\b(3|5|10)\b/);

if(projectionMatch && businessData.length>=3){

const years=parseInt(projectionMatch[1]);

generateAIProjection(years);

output.innerHTML+=`
<div class="ai-response">
Generating ${years}-year projection based on historical revenue growth.
</div>
`;

return;
}

output.innerHTML+=`
<div class="ai-response">
Ask for projections such as:
• 3 year projection
• 5 year projection
• 10 year projection
</div>
`;

}


/* ================= AI PROJECTION ================= */

function generateAIProjection(years){

const canvas=document.getElementById("aiForecastChart");
const explanation=document.getElementById("aiForecastExplanation");

if(aiForecastChart){
aiForecastChart.destroy();
}

const first=businessData[0];
const last=businessData[businessData.length-1];

const monthsDiff=
(last.date.getFullYear()-first.date.getFullYear())*12+
(last.date.getMonth()-first.date.getMonth());

const cagr=Math.pow(last.revenue/first.revenue,1/monthsDiff)-1;

let revenue=last.revenue;

let labels=[];
let data=[];

for(let i=1;i<=years;i++){

revenue=revenue*Math.pow(1+cagr,12);

labels.push("Year "+i);
data.push(Math.round(revenue));

}

aiForecastChart=new Chart(canvas,{
type:"line",
data:{labels,datasets:[{label:"AI Projection",data}]},
options:{responsive:true}
});

explanation.innerHTML=`
ImpactGrid AI projects revenue ${years} years forward using historical compound growth.
Projected revenue after ${years} years: <strong>${formatCurrency(data[data.length-1])}</strong>
`;

}


/* ================= HELPERS ================= */

function bindGlobalFunctions(){
window.addData=addData;
window.setCurrency=setCurrency;
window.askImpactGridAI=askImpactGridAI;
}
