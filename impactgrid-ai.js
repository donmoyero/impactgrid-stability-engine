/* =====================================================
   IMPACTGRID AI ENGINE
   Financial Intelligence & Consultant Engine
===================================================== */

const ImpactGridAI = {

    analyze(question, data, currency) {

        const q = question.toLowerCase();

        if (this.isForecastQuestion(q))
            return this.forecastEngine(q, data, currency);

        if (this.isRiskQuestion(q))
            return this.riskEngine(data, currency);

        if (this.isPerformanceQuestion(q))
            return this.performanceEngine(data, currency);

        if (this.isStrategyQuestion(q))
            return this.strategyEngine(data, currency);

        return this.generalAdvice(data, currency);
    },

/* =====================================================
   INTENT DETECTION
===================================================== */

    isForecastQuestion(q){
        return q.includes("forecast") ||
               q.includes("projection") ||
               q.includes("future") ||
               q.includes("year");
    },

    isRiskQuestion(q){
        return q.includes("risk") ||
               q.includes("stable") ||
               q.includes("volatility");
    },

    isPerformanceQuestion(q){
        return q.includes("performance") ||
               q.includes("health") ||
               q.includes("margin") ||
               q.includes("profit");
    },

    isStrategyQuestion(q){
        return q.includes("improve") ||
               q.includes("grow") ||
               q.includes("increase") ||
               q.includes("strategy");
    },

/* =====================================================
   FORECAST ENGINE
===================================================== */

    forecastEngine(question, data, currency){

        if(data.length < 3){
            return "ImpactGrid AI requires at least 3 months of financial data to generate a reliable projection.";
        }

        let years = 3;

        if(question.includes("5")) years = 5;
        if(question.includes("10")) years = 10;

        const first = data[0];
        const last = data[data.length-1];

        let months =
        (last.date.getFullYear()-first.date.getFullYear())*12 +
        (last.date.getMonth()-first.date.getMonth());

        if(months <= 0) months = 1;

        const cagr = Math.pow(last.revenue / first.revenue, 1 / months) - 1;

        let projected = last.revenue * Math.pow(1 + cagr, years * 12);

        const formatted = new Intl.NumberFormat(undefined,{
            style:"currency",
            currency:currency
        }).format(projected);

        return `
ImpactGrid AI Projection Analysis

Based on your historical revenue growth trajectory,
your business is expanding at an estimated rate of
${(cagr*100).toFixed(2)}% per month.

If this trend continues, projected revenue after
${years} years could reach approximately:

${formatted}

Strategic Insight:
Sustaining this trajectory will depend on maintaining
revenue stability while controlling operational costs.
`;
    },

/* =====================================================
   PERFORMANCE ENGINE
===================================================== */

    performanceEngine(data, currency){

        const revenue = this.sum(data,"revenue");
        const profit = this.sum(data,"profit");

        const margin = revenue > 0 ? (profit/revenue)*100 : 0;

        let comment = "";

        if(margin > 20)
            comment = "Your business demonstrates strong operational efficiency with healthy profit margins.";

        else if(margin > 10)
            comment = "Your business is operating with moderate profitability, but there is room to optimise costs.";

        else
            comment = "Your margins are currently under pressure. Expense management should be reviewed.";

        return `
ImpactGrid AI Performance Review

Total Revenue Recorded:
${this.formatCurrency(revenue,currency)}

Total Profit Generated:
${this.formatCurrency(profit,currency)}

Average Profit Margin:
${margin.toFixed(2)}%

Consultant Insight:
${comment}
`;
    },

/* =====================================================
   RISK ENGINE
===================================================== */

    riskEngine(data, currency){

        const volatility = this.calculateVolatility(data);

        let level = "";
        let explanation = "";

        if(volatility < 15){
            level = "Low";
            explanation = "Revenue patterns are stable and predictable.";
        }
        else if(volatility < 30){
            level = "Moderate";
            explanation = "Some fluctuations exist which may impact planning.";
        }
        else{
            level = "Elevated";
            explanation = "High revenue volatility increases operational risk.";
        }

        return `
ImpactGrid AI Risk Assessment

Revenue Volatility:
${volatility.toFixed(2)}%

Risk Level:
${level}

Consultant Insight:
${explanation}

Recommendation:
Focus on stabilizing recurring revenue streams.
`;
    },

/* =====================================================
   STRATEGY ENGINE
===================================================== */

    strategyEngine(data, currency){

        const margin = this.getMargin(data);
        const volatility = this.calculateVolatility(data);

        let advice = "";

        if(margin < 10)
            advice += "• Review cost structure and operational expenses.\n";

        if(volatility > 30)
            advice += "• Introduce more predictable revenue streams.\n";

        if(margin > 20)
            advice += "• Consider reinvesting profit into growth initiatives.\n";

        if(advice === "")
            advice = "• Continue strengthening revenue stability and scaling operations.";

        return `
ImpactGrid AI Strategic Recommendations

Based on your financial performance:

${advice}

Long-Term Advisory:
Sustainable SME growth is achieved by balancing
profitability, revenue stability, and operational efficiency.
`;
    },

/* =====================================================
   GENERAL ADVICE
===================================================== */

    generalAdvice(data, currency){

        return `
ImpactGrid AI Consultant

You can ask questions such as:

• "3 year projection"
• "How is my business performing?"
• "Is my business risky?"
• "How can I improve profit?"
• "Give strategic advice"
`;
    },

/* =====================================================
   HELPERS
===================================================== */

    sum(data,key){
        return data.reduce((a,b)=>a+(b[key]||0),0);
    },

    calculateVolatility(data){

        const revenues = data.map(d=>d.revenue);

        const mean = revenues.reduce((a,b)=>a+b)/revenues.length;

        const variance = revenues.reduce((a,b)=>a+(b-mean)**2,0)/revenues.length;

        return (Math.sqrt(variance)/mean)*100;
    },

    getMargin(data){

        const revenue = this.sum(data,"revenue");
        const profit = this.sum(data,"profit");

        return revenue>0 ? (profit/revenue)*100 : 0;
    },

    formatCurrency(value,currency){

        return new Intl.NumberFormat(undefined,{
            style:"currency",
            currency:currency
        }).format(value);

    }

};
