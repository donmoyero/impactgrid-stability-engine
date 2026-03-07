/* =====================================================
   IMPACTGRID AI ENGINE — UPGRADED v2.0
   Financial Intelligence & Consultant Engine

   Upgrades applied:
   ✅ Real Claude API integration (intelligent answers)
   ✅ Conversation memory — follows up naturally
   ✅ Financial context passed into every prompt
   ✅ Anomaly detection — flags unusual months
   ✅ Improved forecast using average monthly growth
   ✅ Expanded intent detection (natural language)
   ✅ Suggested follow-up questions after every answer
   ✅ Typing indicator while AI thinks
   ✅ Fallback to local engine if API unavailable
===================================================== */

const ImpactGridAI = {

  /* =====================================================
     MAIN ENTRY POINT
     Called by askImpactGridAI() in script.js
  ===================================================== */

  async analyze(question, data, currency, history = []) {

    /* Always try Claude API first for intelligent answers */
    try {
      const response = await this.callClaudeAPI(question, data, currency, history);
      if (response) return response;
    } catch (e) {
      console.warn("ImpactGrid AI: Claude API unavailable, falling back to local engine.", e);
    }

    /* Fallback: local keyword engine */
    return this.localEngine(question, data, currency);

  },


  /* =====================================================
     CLAUDE API INTEGRATION
  ===================================================== */

  async callClaudeAPI(question, data, currency, history) {

    if (!data || data.length === 0) {
      return this.noDataMessage();
    }

    const systemPrompt = `You are ImpactGrid AI, a professional financial consultant embedded inside a business intelligence dashboard called ImpactGrid.

Your role is to help small and medium-sized business owners understand their financial data, identify risks, and make smarter decisions.

Tone: confident, clear, concise. Use British English. Format responses with short paragraphs and bold key figures. Never use overly complex jargon. Always ground your advice in the actual data provided.

Currency in use: ${currency}

Rules:
- Always refer to specific numbers from the data when answering
- Keep responses under 250 words unless a detailed breakdown is requested
- End every response with 2-3 suggested follow-up questions formatted exactly like this:
  SUGGESTIONS: question one | question two | question three`;

    const dataContext = this.buildDataSummary(data, currency);
    const anomalies = this.detectAnomalies(data);
    const anomalyNote = anomalies.length > 0
      ? `\n\nAnomalies detected: ${anomalies.map(a => `${a.date.toISOString().slice(0,7)} had unusual revenue of ${a.revenue}`).join(", ")}`
      : "";

    /* Build message history (last 8 messages for context) */
    const messages = history.slice(-8).map(m => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content
    }));

    /* Add current question with full data context */
    messages.push({
      role: "user",
      content: `${dataContext}${anomalyNote}\n\nUser question: ${question}`
    });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: messages
      })
    });

    if (!res.ok) {
      console.warn("Claude API error:", res.status);
      return null;
    }

    const result = await res.json();
    const rawText = result?.content?.[0]?.text || null;

    if (!rawText) return null;

    /* Parse out suggestions if present */
    return this.parseAndFormatResponse(rawText, data, currency);

  },


  /* =====================================================
     RESPONSE PARSER
     Extracts suggestions from Claude's response and
     formats them as clickable chips
  ===================================================== */

  parseAndFormatResponse(rawText, data, currency) {

    let mainText = rawText;
    let suggestionsHTML = "";

    const suggMatch = rawText.match(/SUGGESTIONS:\s*(.+)/i);

    if (suggMatch) {
      mainText = rawText.replace(/SUGGESTIONS:.*/is, "").trim();
      const suggestions = suggMatch[1].split("|").map(s => s.trim()).filter(Boolean);

      suggestionsHTML = `
        <div class="ai-suggestions">
          ${suggestions.map(s =>
            `<button class="ai-suggestion-chip" onclick="fillAIChat('${s.replace(/'/g, "\\'")}')">${s}</button>`
          ).join("")}
        </div>`;
    }

    /* Format the main text — bold numbers and key terms */
    const formatted = mainText
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n\n/g, "</p><p>")
      .replace(/\n/g, "<br>");

    /* Trigger forecast chart if question is about projections */
    const lowerQ = mainText.toLowerCase();
    const forecastMatch = lowerQ.match(/(\d+)\s*year/);
    if (forecastMatch && typeof generateAIProjection === "function") {
      try { generateAIProjection(parseInt(forecastMatch[1])); } catch(e) {}
    }

    return `<p>${formatted}</p>${suggestionsHTML}`;

  },


  /* =====================================================
     DATA SUMMARY BUILDER
     Converts businessData into a readable string for the AI
  ===================================================== */

  buildDataSummary(data, currency) {

    if (!data || data.length === 0) return "No financial data has been entered yet.";

    const totalRevenue = this.sum(data, "revenue");
    const totalProfit = this.sum(data, "profit");
    const totalExpenses = this.sum(data, "expenses");
    const margin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;
    const growth = this.calculateGrowth(data);
    const volatility = this.calculateVolatility(data);
    const avgMonthlyGrowth = this.calculateAvgMonthlyGrowth(data);

    const monthlyBreakdown = data.map(d =>
      `  ${d.date.toISOString().slice(0, 7)}: revenue ${d.revenue}, expenses ${d.expenses}, profit ${d.profit}`
    ).join("\n");

    return `BUSINESS FINANCIAL DATA (${currency}):
Monthly breakdown:
${monthlyBreakdown}

Summary:
- Total Revenue: ${totalRevenue}
- Total Expenses: ${totalExpenses}
- Total Profit: ${totalProfit}
- Profit Margin: ${margin}%
- Overall Revenue Growth: ${growth.toFixed(1)}%
- Average Monthly Growth Rate: ${(avgMonthlyGrowth * 100).toFixed(2)}%
- Revenue Volatility: ${volatility.toFixed(1)}%
- Months of data: ${data.length}`;

  },


  /* =====================================================
     ANOMALY DETECTION ENGINE
     Flags months where revenue deviates > 1.5 std devs
  ===================================================== */

  detectAnomalies(data) {

    if (!data || data.length < 3) return [];

    const revenues = data.map(d => d.revenue);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const variance = revenues.reduce((a, b) => a + (b - mean) ** 2, 0) / revenues.length;
    const std = Math.sqrt(variance);

    return data.filter(d => Math.abs(d.revenue - mean) > 1.5 * std);

  },


  /* =====================================================
     IMPROVED FORECAST ENGINE
     Uses average monthly growth rate across ALL months
     (more stable than first-vs-last CAGR)
  ===================================================== */

  calculateAvgMonthlyGrowth(data) {

    if (!data || data.length < 2) return 0;

    const growthRates = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i - 1].revenue > 0) {
        growthRates.push((data[i].revenue - data[i - 1].revenue) / data[i - 1].revenue);
      }
    }

    if (growthRates.length === 0) return 0;

    return growthRates.reduce((a, b) => a + b, 0) / growthRates.length;

  },


  /* =====================================================
     LOCAL FALLBACK ENGINE
     Used when Claude API is unavailable
  ===================================================== */

  localEngine(question, data, currency) {

    const q = question.toLowerCase().trim();

    if (this.isForecastQuestion(q)) return this.forecastEngine(q, data, currency);
    if (this.isRiskQuestion(q))     return this.riskEngine(data, currency);
    if (this.isPerformanceQuestion(q)) return this.performanceEngine(data, currency);
    if (this.isStrategyQuestion(q)) return this.strategyEngine(data, currency);
    if (this.isChartQuestion(q))    return this.chartExplanation(data, currency);
    if (this.isAnomalyQuestion(q))  return this.anomalyEngine(data, currency);

    return this.generalAdvice();

  },


  /* =====================================================
     INTENT DETECTION — expanded keyword lists
  ===================================================== */

  isForecastQuestion(q) {
    const words = ["forecast","projection","project","future","year","next","predict","grow to","earn","expect","will i","how much will","outlook","trajectory"];
    return words.some(w => q.includes(w)) || /^\d+$/.test(q.trim());
  },

  isRiskQuestion(q) {
    const words = ["risk","stable","stability","volatility","volatile","danger","safe","uncertain","consistent"];
    return words.some(w => q.includes(w));
  },

  isPerformanceQuestion(q) {
    const words = ["performance","health","profit","margin","how am i","how are we","doing well","revenue","income","results"];
    return words.some(w => q.includes(w));
  },

  isStrategyQuestion(q) {
    const words = ["strategy","improve","grow","increase","advice","recommend","should i","what should","help me","optimize","optimise","scale","tips"];
    return words.some(w => q.includes(w));
  },

  isChartQuestion(q) {
    const words = ["chart","analysis","analyse","analyze","explain","what does","tell me about","breakdown","summary","overview"];
    return words.some(w => q.includes(w));
  },

  isAnomalyQuestion(q) {
    const words = ["anomaly","unusual","spike","drop","weird","strange","outlier","different","stand out"];
    return words.some(w => q.includes(w));
  },


  /* =====================================================
     LOCAL FORECAST ENGINE (fallback)
  ===================================================== */

  forecastEngine(question, data, currency) {

    if (data.length < 3) {
      return "ImpactGrid AI requires at least 3 months of financial data before projections can be generated.";
    }

    let years = 3;
    if (question.includes("5")) years = 5;
    if (question.includes("10")) years = 10;

    try {
      if (typeof generateAIProjection === "function") generateAIProjection(years);
    } catch(e) {
      console.warn("Forecast chart not ready", e);
    }

    const avgGrowth = this.calculateAvgMonthlyGrowth(data);
    const last = data[data.length - 1];
    const projected = last.revenue * Math.pow(1 + avgGrowth, years * 12);
    const projectedClamped = Math.max(0, projected);

    return `<p><strong>ImpactGrid AI — ${years}-Year Projection</strong></p>
<p>Based on your average monthly growth rate of <strong>${(avgGrowth * 100).toFixed(2)}%</strong>, projected revenue after <strong>${years} years</strong> could reach:</p>
<p><strong>${this.formatCurrency(projectedClamped, currency)}</strong></p>
<p>This forecast has been generated on the chart below. Growth assumes current trends continue — external market shifts are not factored in.</p>
${this.suggestionChips(["10 year forecast","How risky is my business?","How can I improve my margin?"])}`;

  },


  /* =====================================================
     LOCAL PERFORMANCE ENGINE (fallback)
  ===================================================== */

  performanceEngine(data, currency) {

    const revenue = this.sum(data, "revenue");
    const profit = this.sum(data, "profit");
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    let insight = margin > 20
      ? "Your business demonstrates strong profitability and efficient operations."
      : margin > 10
        ? "Your business shows moderate profitability with room to optimise margins."
        : "Profit margins are under pressure — operational costs may need reviewing.";

    return `<p><strong>ImpactGrid AI — Performance Review</strong></p>
<p>Total Revenue: <strong>${this.formatCurrency(revenue, currency)}</strong><br>
Total Profit: <strong>${this.formatCurrency(profit, currency)}</strong><br>
Profit Margin: <strong>${margin.toFixed(2)}%</strong></p>
<p>${insight}</p>
${this.suggestionChips(["3 year forecast","How can I grow?","What are my risks?"])}`;

  },


  /* =====================================================
     LOCAL RISK ENGINE (fallback)
  ===================================================== */

  riskEngine(data, currency) {

    const volatility = this.calculateVolatility(data);
    const level = volatility < 15 ? "Low" : volatility < 30 ? "Moderate" : "Elevated";
    const explanation = volatility < 15
      ? "Revenue behaviour appears stable and predictable."
      : volatility < 30
        ? "Revenue fluctuations exist but remain manageable."
        : "High volatility may be increasing your operational risk.";

    return `<p><strong>ImpactGrid AI — Risk Assessment</strong></p>
<p>Revenue Volatility: <strong>${volatility.toFixed(2)}%</strong><br>
Risk Level: <strong>${level}</strong></p>
<p>${explanation}</p>
<p>Focus on stabilising recurring revenue streams to reduce dependence on unpredictable income sources.</p>
${this.suggestionChips(["How can I reduce risk?","What's my profit margin?","5 year forecast"])}`;

  },


  /* =====================================================
     LOCAL STRATEGY ENGINE (fallback)
  ===================================================== */

  strategyEngine(data, currency) {

    const margin = this.getMargin(data);
    const volatility = this.calculateVolatility(data);
    const growth = this.calculateGrowth(data);

    let bullets = [];

    if (margin < 10)    bullets.push("Review your cost structure — margins below 10% leave little room for error.");
    if (volatility > 30) bullets.push("Introduce more predictable recurring revenue to reduce income volatility.");
    if (growth < 0)     bullets.push("Revenue is declining — identify your top performing months and what drove them.");
    if (margin > 20)    bullets.push("Strong margins — consider reinvesting profits into growth initiatives.");
    if (bullets.length === 0) bullets.push("Continue scaling while maintaining financial discipline and cost control.");

    return `<p><strong>ImpactGrid AI — Strategic Recommendations</strong></p>
<p>${bullets.map(b => `• ${b}`).join("<br>")}</p>
<p>Sustainable growth comes from balanced profitability, revenue stability, and operational efficiency.</p>
${this.suggestionChips(["What are my risks?","Show my performance","3 year forecast"])}`;

  },


  /* =====================================================
     CHART ANALYSIS (fallback)
  ===================================================== */

  chartExplanation(data, currency) {

    if (data.length < 3) return "ImpactGrid AI requires additional records to analyse chart behaviour.";

    const growth = this.calculateGrowth(data);
    const volatility = this.calculateVolatility(data);
    const trend = growth > 10 ? "strong upward" : growth > 0 ? "gradual upward" : "declining";

    return `<p><strong>ImpactGrid AI — Chart Analysis</strong></p>
<p>Your charts show a <strong>${trend} trend</strong> with <strong>${growth.toFixed(1)}%</strong> overall revenue growth and <strong>${volatility.toFixed(1)}%</strong> volatility.</p>
<p>Consistent revenue growth paired with controlled expenses indicates a healthy financial trajectory. Spikes in the expense chart may signal one-off costs worth investigating.</p>
${this.suggestionChips(["Explain my risks","3 year forecast","Strategic advice"])}`;

  },


  /* =====================================================
     ANOMALY ENGINE
  ===================================================== */

  anomalyEngine(data, currency) {

    const anomalies = this.detectAnomalies(data);

    if (anomalies.length === 0) {
      return `<p><strong>ImpactGrid AI — Anomaly Check</strong></p>
<p>No significant anomalies detected. Your revenue has been consistent across all recorded months.</p>
${this.suggestionChips(["Show my performance","What are my risks?","3 year forecast"])}`;
    }

    const list = anomalies.map(a =>
      `• <strong>${a.date.toISOString().slice(0,7)}</strong> — Revenue: ${this.formatCurrency(a.revenue, currency)}`
    ).join("<br>");

    return `<p><strong>ImpactGrid AI — Anomaly Detection</strong></p>
<p>The following months show unusual revenue patterns:</p>
<p>${list}</p>
<p>Investigate what caused these outliers — they could represent exceptional wins to replicate or problems to address.</p>
${this.suggestionChips(["Why might this have happened?","How do I stabilise revenue?","Show my risks"])}`;

  },


  /* =====================================================
     GENERAL ADVICE / HELP
  ===================================================== */

  generalAdvice() {

    return `<p><strong>ImpactGrid AI — How can I help?</strong></p>
<p>Try asking me things like:</p>
<p>
• "3 year projection"<br>
• "5 year forecast"<br>
• "How risky is my business?"<br>
• "What's my profit margin?"<br>
• "How can I improve profitability?"<br>
• "Explain my charts"<br>
• "Are there any anomalies in my data?"<br>
• "Give me strategic advice"
</p>
${this.suggestionChips(["3 year forecast","How risky is my business?","How can I improve?"])}`;

  },


  /* =====================================================
     NO DATA MESSAGE
  ===================================================== */

  noDataMessage() {
    return `<p><strong>ImpactGrid AI</strong></p>
<p>Please enter at least one month of financial data before asking questions. Once you've added your revenue and expenses, I can analyse your business performance, forecast growth, and identify risks.</p>`;
  },


  /* =====================================================
     SUGGESTION CHIPS BUILDER
  ===================================================== */

  suggestionChips(suggestions) {
    return `<div class="ai-suggestions">
      ${suggestions.map(s =>
        `<button class="ai-suggestion-chip" onclick="fillAIChat('${s.replace(/'/g, "\\'")}')">${s}</button>`
      ).join("")}
    </div>`;
  },


  /* =====================================================
     SHARED HELPERS
  ===================================================== */

  sum(data, key) {
    return data.reduce((a, b) => a + (b[key] || 0), 0);
  },

  calculateVolatility(data) {
    if (!data || data.length < 2) return 0;
    const revenues = data.map(d => d.revenue);
    const mean = revenues.reduce((a, b) => a + b, 0) / revenues.length;
    const variance = revenues.reduce((a, b) => a + (b - mean) ** 2, 0) / revenues.length;
    return mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0;
  },

  calculateGrowth(data) {
    if (!data || data.length < 2) return 0;
    const first = data[0].revenue;
    const last = data[data.length - 1].revenue;
    return first > 0 ? ((last - first) / first) * 100 : 0;
  },

  getMargin(data) {
    const revenue = this.sum(data, "revenue");
    const profit = this.sum(data, "profit");
    return revenue > 0 ? (profit / revenue) * 100 : 0;
  },

  formatCurrency(value, currency) {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency
    }).format(value);
  }

};
