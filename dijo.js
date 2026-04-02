const API = "https://impactgrid-dijo-api.onrender.com";

let cvText = "";
let extractedProfile = null;
let matchedJobs = [];

/* =========================
   INIT
========================= */
document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("startBtn");
  const nextBtns = document.querySelectorAll(".nextBtn");

  startBtn.onclick = () => {
    document.getElementById("landing").style.display = "none";
    document.getElementById("app").style.display = "block";
  };

  nextBtns.forEach(btn => {
    btn.onclick = () => nextStep();
  });
});

/* =========================
   STEP FLOW
========================= */
function nextStep() {
  const current = document.querySelector(".step.active");
  const next = current.nextElementSibling;

  if (!next) return;

  current.classList.remove("active");
  current.style.display = "none";

  next.classList.add("active");
  next.style.display = "block";

  if (next.id === "step3") analyseCV();
}

/* =========================
   ANALYSE CV
========================= */
async function analyseCV() {
  cvText = document.getElementById("cvText").value;

  if (!cvText) {
    alert("Paste your CV first");
    return;
  }

  document.getElementById("loadingText").innerText = "Understanding your profile...";

  /* PROFILE */
  try {
    const res = await fetch(API + "/ai/extract-profile", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ cv_text: cvText })
    });

    extractedProfile = await res.json();

  } catch (err) {
    console.error(err);
    return;
  }

  document.getElementById("loadingText").innerText = "Finding jobs...";

  /* JOBS */
  let jobs = [];

  try {
    const res = await fetch(API + "/ai/jobs");
    const data = await res.json();
    jobs = data.jobs || [];
  } catch (err) {
    console.error(err);
    return;
  }

  /* FILTER */
  const keywords = extractedProfile.search_keywords || [];

  const filtered = jobs.filter(j => {
    const text = (j.title + " " + j.description).toLowerCase();
    return keywords.some(k => text.includes(k.toLowerCase()));
  }).slice(0, 8);

  document.getElementById("loadingText").innerText = "Matching jobs...";

  /* MATCH */
  const results = [];

  for (let job of filtered) {
    try {
      const res = await fetch(API + "/ai/match", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          cv_text: cvText,
          job_description: job.description
        })
      });

      const data = await res.json();

      results.push({
        ...job,
        score: data.result?.score || 0,
        reasons: data.result?.reasons || []
      });

    } catch (err) {
      console.error(err);
    }
  }

  results.sort((a,b)=>b.score-a.score);

  matchedJobs = results.slice(0,3);

  showResults();

  goToStep("step4");
}

/* =========================
   SHOW RESULTS
========================= */
function showResults() {
  const container = document.getElementById("jobs");

  if (!matchedJobs.length) {
    container.innerHTML = "<p>No strong matches found</p>";
    return;
  }

  container.innerHTML = matchedJobs.map((job, i) => `
    <div class="job-card" style="border:2px solid ${i===0?'gold':'#333'};padding:15px;margin:10px 0;">
      <h3>${escapeHTML(job.title)}</h3>
      <p>${escapeHTML(job.company_name)}</p>

      <p><strong>${job.score}% Match</strong></p>

      <ul>
        ${(job.reasons || []).slice(0,2).map(r => `<li>${escapeHTML(r)}</li>`).join("")}
      </ul>

      <button onclick="applyJob(${i})">Apply</button>
    </div>
  `).join("");
}

/* =========================
   APPLY
========================= */
function applyJob(index) {
  const job = matchedJobs[index];

  goToStep("step5");

  setTimeout(() => {
    document.getElementById("result").innerHTML = `
      <p>✅ Applied to <strong>${escapeHTML(job.title)}</strong></p>
      <p>Dijo says: Strong match. Apply to more roles to increase success.</p>
    `;

    goToStep("step6");
  }, 1500);
}

/* =========================
   STEP CONTROL
========================= */
function goToStep(id) {
  document.querySelectorAll(".step").forEach(s => {
    s.classList.remove("active");
    s.style.display = "none";
  });

  const step = document.getElementById(id);
  step.classList.add("active");
  step.style.display = "block";
}

/* =========================
   SAFE HTML
========================= */
function escapeHTML(str) {
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;");
}
