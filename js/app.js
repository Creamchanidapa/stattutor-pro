// =========================================================================
// APP CONTROLLER: StatTutor Pro
// Navigation, State Management, Interactive Tools & Learning Flow
// =========================================================================

document.addEventListener("DOMContentLoaded", () => {
  // Application State
  const state = {
    currentTab: "variables", // Default to new Variables Glossary page
    selectedChapterId: "ch5", // Default to Chapter 5 (Core of Final)
    currentSubTab: "concept",
    storyMode: true, // "Math Anxiety Detox" friendly analogies vs formal
    progress: JSON.parse(localStorage.getItem("stattutor_progress") || "{}"),
    examDate: new Date(2026, 9, 12, 9, 0, 0), // 12 Oct 2026
    currentDecisionNode: "q1"
  };

  // Init UI Components
  initCountdown();
  initNavigation();
  initVariablesGlossary();
  initRoadmap();
  initChapterSelector();
  renderCurrentChapter();
  initInteractiveSolvers();
  initDecisionWizard();
  initPracticeArena();
  initStatTables();
  updateProgressBadge();

  // Helper: Switch Tab programmatically
  function switchTab(tab, shouldScroll = true) {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(b => b.classList.toggle("active", b.dataset.tab === tab));

    const editorialLinks = document.querySelectorAll(".nav-editorial-link");
    editorialLinks.forEach(b => b.classList.toggle("active", b.dataset.tab === tab));

    state.currentTab = tab;

    document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
    const targetSec = document.getElementById(`view-${tab}`);
    if (targetSec) targetSec.classList.add("active");

    if (tab === "solvers") {
      setTimeout(updateHypoCanvas, 50);
      setTimeout(updateRegressionCanvas, 50);
    }

    if (shouldScroll) {
      const mainApp = document.querySelector(".app-container");
      if (mainApp) {
        const topOffset = mainApp.getBoundingClientRect().top + window.pageYOffset - 130;
        window.scrollTo({ top: Math.max(0, topOffset), behavior: "smooth" });
      }
    }
  }

  // 1. Countdown Timer
  function initCountdown() {
    const timerEl = document.getElementById("countdownTimer");
    if (!timerEl) return;

    function updateTimer() {
      const now = new Date();
      const diff = state.examDate - now;

      if (diff <= 0) {
        timerEl.innerHTML = `<span class="badge danger">ถึงวันสอบแล้ว! สู้ให้เต็มที่ครับ!</span>`;
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const chipText = document.getElementById("countdownChipText");
      if (chipText) {
        chipText.innerText = `Final: ${days} วัน ${hours} ชม.`;
      }

      timerEl.innerHTML = `
        <div class="countdown-boxes">
          <div class="time-box"><span class="num">${days}</span><span class="lbl">วัน</span></div>
          <div class="time-box"><span class="num">${hours}</span><span class="lbl">ชม.</span></div>
          <div class="time-box"><span class="num">${mins}</span><span class="lbl">นาที</span></div>
          <div class="time-box"><span class="num">${secs}</span><span class="lbl">วิ</span></div>
        </div>
      `;
    }
    updateTimer();
    setInterval(updateTimer, 1000);
  }

  // 1.5 Exam Prep Roadmap (ขั้นตอนการติวสอบ 5 ขั้น)
  function initRoadmap() {
    const roadmapSec = document.getElementById("view-roadmap");
    if (!roadmapSec) return;

    const savedSteps = JSON.parse(localStorage.getItem("stattutor_roadmap_steps") || "{}");
    const stepChecks = document.querySelectorAll(".roadmap-step-check");
    const progressText = document.getElementById("roadmapProgressText");

    function updateRoadmapProgress() {
      let count = 0;
      stepChecks.forEach(chk => {
        const step = chk.dataset.step;
        const isDone = !!savedSteps[step];
        chk.checked = isDone;
        const parent = chk.closest(".step-check-item");
        if (parent) parent.classList.toggle("completed", isDone);
        if (isDone) count++;
      });
      const pct = Math.round((count / stepChecks.length) * 100);
      if (progressText) {
        progressText.innerText = `ทำเสร็จแล้ว ${count}/${stepChecks.length} ขั้นตอน (${pct}%)`;
      }
      localStorage.setItem("stattutor_roadmap_steps", JSON.stringify(savedSteps));
    }

    stepChecks.forEach(chk => {
      chk.addEventListener("change", () => {
        savedSteps[chk.dataset.step] = chk.checked;
        updateRoadmapProgress();
      });
    });

    updateRoadmapProgress();

    // Roadmap Jump Buttons
    document.querySelectorAll(".roadmap-jump-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const targetTab = btn.dataset.targetTab;
        if (!targetTab) return;

        if (targetTab === "chapters" && btn.dataset.chapter) {
          state.selectedChapterId = btn.dataset.chapter;
          document.querySelectorAll(".chapter-card-item").forEach(item => {
            item.classList.toggle("active", item.dataset.id === btn.dataset.chapter);
          });
          renderCurrentChapter();
        }

        if (targetTab === "practice" && btn.dataset.filter) {
          const filterBtn = document.querySelector(`.practice-filter-btn[data-filter="${btn.dataset.filter}"]`);
          if (filterBtn) filterBtn.click();
        }

        switchTab(targetTab);
      });
    });

    // Auto-render math in roadmap
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(roadmapSec, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("Roadmap renderMathInElement error:", e);
      }
    }
  }

  // 2. Navigation Tabs
  function initNavigation() {
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    const editorialLinks = document.querySelectorAll(".nav-editorial-link");
    editorialLinks.forEach(btn => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        switchTab(tab);
      });
    });

    const brandBtn = document.getElementById("brandLogoBtn");
    if (brandBtn) {
      brandBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    const navPillCta = document.getElementById("navPillCta");
    if (navPillCta) {
      navPillCta.addEventListener("click", () => switchTab("variables"));
    }

    const heroCtaVars = document.getElementById("heroCtaVariables");
    if (heroCtaVars) {
      heroCtaVars.addEventListener("click", () => switchTab("variables"));
    }

    const heroCtaRoad = document.getElementById("heroCtaRoadmap");
    if (heroCtaRoad) {
      heroCtaRoad.addEventListener("click", () => switchTab("roadmap"));
    }

    const heroCtaPract = document.getElementById("heroCtaPractice");
    if (heroCtaPract) {
      heroCtaPract.addEventListener("click", () => switchTab("practice"));
    }

    // Story Mode Toggle ("โหมดคนไม่ชอบเลข")
    const storyToggle = document.getElementById("storyModeToggle");
    if (storyToggle) {
      storyToggle.addEventListener("change", (e) => {
        state.storyMode = e.target.checked;
        renderCurrentChapter();
      });
    }
  }

  // 3. Chapter Selector Sidebar / Pills
  function initChapterSelector() {
    const listContainer = document.getElementById("chapterListContainer");
    if (!listContainer) return;

    listContainer.innerHTML = STATS_DATA.chapters.map(ch => {
      const isDone = state.progress[ch.id] || false;
      const isCore = ch.isFinalCore;
      return `
        <div class="chapter-card-item ${ch.id === state.selectedChapterId ? 'active' : ''}" data-id="${ch.id}">
          <div class="ch-badge-row">
            <span class="ch-tag ${isCore ? 'core' : 'basic'}">${isCore ? '⭐ Final Core' : 'พื้นฐาน'}</span>
            <span class="ch-pages">น. ${ch.pageRange}</span>
          </div>
          <div class="ch-name">บทที่ ${ch.number}: ${ch.title}</div>
          <div class="ch-sub">${ch.englishTitle}</div>
          <div class="ch-status">
            <input type="checkbox" class="ch-checkbox" data-id="${ch.id}" ${isDone ? 'checked' : ''} />
            <label>ติวแล้ว เข้าใจแล้ว</label>
          </div>
        </div>
      `;
    }).join("");

    // Click handler for chapter selection
    listContainer.querySelectorAll(".chapter-card-item").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.type === "checkbox") return; // Handled separately
        listContainer.querySelectorAll(".chapter-card-item").forEach(c => c.classList.remove("active"));
        card.classList.add("active");
        state.selectedChapterId = card.dataset.id;
        state.currentSubTab = "concept";
        renderCurrentChapter();
      });
    });

    // Checkbox handler for progress
    listContainer.querySelectorAll(".ch-checkbox").forEach(cb => {
      cb.addEventListener("change", (e) => {
        const chId = e.target.dataset.id;
        state.progress[chId] = e.target.checked;
        localStorage.setItem("stattutor_progress", JSON.stringify(state.progress));
        updateProgressBadge();
      });
    });
  }

  // 4. Render Current Chapter Content
  function renderCurrentChapter() {
    const ch = STATS_DATA.chapters.find(c => c.id === state.selectedChapterId);
    if (!ch) return;

    const detailContainer = document.getElementById("chapterDetailContainer");
    if (!detailContainer) return;

    detailContainer.innerHTML = `
      <div class="chapter-header-box">
        <div class="badge-row">
          <span class="badge ${ch.isFinalCore ? 'danger-badge' : 'info-badge'}">${ch.badge}</span>
          <span class="badge slate-badge">หนังสือ อ.ดร.ชัยวัฒน์ (หน้า ${ch.pageRange})</span>
        </div>
        <h2 class="chapter-title-main">บทที่ ${ch.number}: ${ch.title}</h2>
        <div class="chapter-eng-title">${ch.englishTitle}</div>

        <!-- Math Anxiety Detox Banner -->
        <div class="story-analogy-card ${state.storyMode ? 'highlight' : ''}">
          <div class="analogy-icon">💡</div>
          <div class="analogy-body">
            <div class="analogy-title">เรื่องเล่าเห็นภาพ (สำหรับคนไม่ชอบสูตรคณิต):</div>
            <div class="analogy-text">${ch.storyAnalogy}</div>
            <div class="analogy-why"><strong>ทำไมบทนี้ถึงสำคัญในธุรกิจ:</strong> ${ch.whyMatters}</div>
          </div>
        </div>

        <!-- Sub Tabs -->
        <div class="sub-tab-nav">
          <button class="sub-tab-btn ${state.currentSubTab === 'concept' ? 'active' : ''}" data-sub="concept">1. สรุปแนวคิดหลัก (Concepts)</button>
          <button class="sub-tab-btn ${state.currentSubTab === 'formulas' ? 'active' : ''}" data-sub="formulas">2. สูตร & วิธีเลือกใช้</button>
          <button class="sub-tab-btn ${state.currentSubTab === 'examples' ? 'active' : ''}" data-sub="examples">3. ตัวอย่างข้อสอบจริง (Step-by-Step)</button>
          <button class="sub-tab-btn ${state.currentSubTab === 'tricks' ? 'active' : ''}" data-sub="tricks">4. จุดหลอกที่ต้องระวัง!</button>
        </div>
      </div>

      <div class="sub-tab-content-area">
        ${renderSubTabContent(ch, state.currentSubTab)}
      </div>
    `;

    // Add sub tab listeners
    detailContainer.querySelectorAll(".sub-tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        state.currentSubTab = btn.dataset.sub;
        renderCurrentChapter();
      });
    });

    // Auto-render math expressions using KaTeX
    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(detailContainer, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (e) {
        console.warn("renderMathInElement error:", e);
      }
    }
  }

  function renderMathInline(latex) {
    if (window.katex) {
      try {
        return window.katex.renderToString(latex, {
          displayMode: false,
          throwOnError: false
        });
      } catch (err) {
        console.warn("KaTeX inline render error:", err);
      }
    }
    return latex;
  }

  function renderMathDisplay(latex) {
    if (window.katex) {
      try {
        return window.katex.renderToString(latex, {
          displayMode: true,
          throwOnError: false
        });
      } catch (err) {
        console.warn("KaTeX display render error:", err);
      }
    }
    return latex;
  }

  function renderSubTabContent(ch, subTab) {
    if (subTab === "concept") {
      return `
        <div class="concepts-grid">
          ${ch.keyConcepts.map(c => `
            <div class="concept-card">
              <h3 class="concept-title">${c.title}</h3>
              <div class="concept-desc">${c.desc.replace(/\n/g, "<br>")}</div>
            </div>
          `).join("")}
        </div>
      `;
    }

    if (subTab === "formulas") {
      return `
        <div class="formulas-list">
          ${ch.formulas.map(f => `
            <div class="formula-card">
              <div class="formula-header">
                <span class="formula-name">${f.name}</span>
                <span class="formula-cond-badge">เมื่อไหร่ใช้: ${f.condition}</span>
              </div>
              <div class="formula-math-display">${renderMathDisplay(f.latex)}</div>
              <div class="formula-vars">
                <span class="var-title">🔍 ความหมายตัวแปร:</span>
                <span class="var-body">${f.variables}</span>
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    if (subTab === "examples") {
      return `
        <div class="examples-list">
          ${ch.workedExamples.map((ex, i) => `
            <div class="example-card">
              <div class="example-header">
                <span class="badge info-badge">ตัวอย่างจากหนังสือ</span>
                <h4 class="example-title">${ex.title}</h4>
              </div>
              <div class="example-problem">${ex.problem}</div>
              <div class="example-steps">
                <h5>ขั้นตอนการคิดและวิธีคำนวณทีละขั้น:</h5>
                ${ex.stepByStep.map(step => `
                  <div class="step-item">${step.replace(/\n/g, "<br>")}</div>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      `;
    }

    if (subTab === "tricks") {
      return `
        <div class="tricks-container">
          <div class="tricks-header">
            <span class="alert-icon">⚠️</span>
            <h3>จุดที่นิสิตชอบพลาดในข้อสอบ Final ของ อ.ดร.ชัยวัฒน์</h3>
          </div>
          <ul class="tricks-list">
            ${ch.examTricks.map(t => `<li>${t}</li>`).join("")}
          </ul>
        </div>
      `;
    }
    return "";
  }

  // 5. Progress Badge
  function updateProgressBadge() {
    const totalChapters = STATS_DATA.chapters.length;
    const completed = Object.values(state.progress).filter(Boolean).length;
    const percent = Math.round((completed / totalChapters) * 100);

    const progressFill = document.getElementById("overallProgressFill");
    const progressText = document.getElementById("overallProgressText");

    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressText) progressText.innerText = `ความพร้อมสอบ: ${completed}/${totalChapters} บท (${percent}%)`;
  }

  // 6. Interactive Decision Wizard ("หนูไม่รู้จะใช้สูตรไหน")
  function initDecisionWizard() {
    const wizardContainer = document.getElementById("decisionWizardContainer");
    if (!wizardContainer) return;

    renderDecisionNode("q1");

    function renderDecisionNode(nodeId) {
      const node = STATS_DATA.decisionTree.find(n => n.id === nodeId);
      if (!node) return;

      if (node.result) {
        // Result node
        wizardContainer.innerHTML = `
          <div class="wizard-result-card">
            <div class="res-badge">🎯 ฟันธงสูตรที่ต้องใช้:</div>
            <div class="res-text">${node.result.replace(/\n/g, "<br>")}</div>
            <button class="btn btn-secondary mt-3" id="resetWizardBtn">↺ ถามโจทย์ข้อใหม่</button>
          </div>
        `;
        document.getElementById("resetWizardBtn")?.addEventListener("click", () => renderDecisionNode("q1"));
        return;
      }

      wizardContainer.innerHTML = `
        <div class="wizard-question-card">
          <div class="wizard-step-indicator">🧭 คำถามนำทางสู่สูตรที่ถูกต้อง:</div>
          <h3 class="wizard-question-title">${node.question}</h3>
          <div class="wizard-options-grid">
            ${node.options.map((opt, idx) => `
              <button class="wizard-opt-btn" data-idx="${idx}">
                ${opt.label}
              </button>
            `).join("")}
          </div>
          ${nodeId !== "q1" ? `<button class="btn btn-text mt-3" id="backWizardBtn">← ย้อนกลับ</button>` : ""}
        </div>
      `;

      wizardContainer.querySelectorAll(".wizard-opt-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const opt = node.options[btn.dataset.idx];
          if (opt.next) {
            renderDecisionNode(opt.next);
          } else if (opt.result) {
            wizardContainer.innerHTML = `
              <div class="wizard-result-card">
                <div class="res-badge">🎯 ฟันธงสูตรที่ต้องใช้:</div>
                <div class="res-text">${opt.result.replace(/\n/g, "<br>")}</div>
                <button class="btn btn-secondary mt-3" id="resetWizardBtn">↺ ถามโจทย์ข้อใหม่</button>
              </div>
            `;
            document.getElementById("resetWizardBtn")?.addEventListener("click", () => renderDecisionNode("q1"));
          }
        });
      });

      document.getElementById("backWizardBtn")?.addEventListener("click", () => renderDecisionNode("q1"));
    }
  }

  // 7. Interactive Hypothesis Test & Regression Solvers
  function initInteractiveSolvers() {
    // Hypothesis test inputs
    const inputs = ["hypo_mu0", "hypo_xbar", "hypo_s", "hypo_n", "hypo_alpha", "hypo_tail"];
    inputs.forEach(id => {
      document.getElementById(id)?.addEventListener("input", updateHypoCanvas);
    });

    // Regression dataset buttons
    document.getElementById("btnLoadLuckyData")?.addEventListener("click", () => {
      // Load Lucky Co. from Chapter 7
      const pts = [
        { x: 0.8, y: 22 }, { x: 1.0, y: 28 }, { x: 1.6, y: 22 }, { x: 2.0, y: 26 },
        { x: 2.2, y: 34 }, { x: 2.6, y: 18 }, { x: 3.0, y: 30 }, { x: 3.0, y: 38 },
        { x: 4.0, y: 30 }, { x: 4.0, y: 40 }, { x: 4.0, y: 50 }, { x: 4.6, y: 46 }
      ];
      document.getElementById("reg_data_input").value = pts.map(p => `${p.x},${p.y}`).join("\n");
      updateRegressionCanvas();
    });

    document.getElementById("reg_data_input")?.addEventListener("input", updateRegressionCanvas);

    // SPSS Output cell clicks
    document.querySelectorAll(".spss-clickable-cell").forEach(cell => {
      cell.addEventListener("click", () => {
        const info = cell.dataset.info || "ไม่มีคำอธิบายเพิ่มเติม";
        const title = cell.dataset.title || "คำอธิบายค่านี้";
        showModal(title, info);
      });
    });
  }

  function updateHypoCanvas() {
    const mu0 = parseFloat(document.getElementById("hypo_mu0")?.value || 880);
    const xbar = parseFloat(document.getElementById("hypo_xbar")?.value || 871);
    const s = parseFloat(document.getElementById("hypo_s")?.value || 21);
    const n = parseInt(document.getElementById("hypo_n")?.value || 60);
    const alpha = parseFloat(document.getElementById("hypo_alpha")?.value || 0.01);
    const tail = document.getElementById("hypo_tail")?.value || "left";

    // Compute standard error
    const se = s / Math.sqrt(n);
    const zCal = (xbar - mu0) / se;

    // Get Z critical approx
    let zCrit = 1.96;
    if (tail === "two") {
      zCrit = alpha === 0.01 ? 2.576 : alpha === 0.10 ? 1.645 : 1.960;
    } else {
      zCrit = alpha === 0.01 ? 2.326 : alpha === 0.10 ? 1.282 : 1.645;
    }

    // Determine decision
    let rejectH0 = false;
    if (tail === "two") {
      rejectH0 = Math.abs(zCal) > zCrit;
    } else if (tail === "right") {
      rejectH0 = zCal > zCrit;
    } else if (tail === "left") {
      rejectH0 = zCal < -zCrit;
    }

    // Render Steps
    const stepsOutput = document.getElementById("hypoStepsOutput");
    if (stepsOutput) {
      stepsOutput.innerHTML = `
        <div class="solver-step"><strong>ขั้นที่ 1: ตั้งสมมติฐาน</strong><br>
          $H_0: \\mu ${tail === 'two' ? '=' : tail === 'right' ? '\\le' : '\\ge'} ${mu0}$<br>
          $H_1: \\mu ${tail === 'two' ? '\\ne' : tail === 'right' ? '>' : '<'} ${mu0}$
        </div>
        <div class="solver-step"><strong>ขั้นที่ 2: ค่าวิกฤต (Critical Value)</strong><br>
          $\\alpha = ${alpha}$ (${tail === 'two' ? 'ทดสอบสองหาง' : tail === 'right' ? 'ทดสอบหางขวา' : 'ทดสอบหางซ้าย'}) $\\implies Z_{\\text{crit}} = ${tail === 'left' ? '-' : ''}${zCrit.toFixed(2)}$
        </div>
        <div class="solver-step"><strong>ขั้นที่ 3: คำนวณค่าสถิติทดสอบ (Z_cal)</strong><br>
          $$Z_{\\text{cal}} = \\frac{\\bar{X} - \\mu_0}{\\frac{S}{\\sqrt{n}}} = \\frac{${xbar} - ${mu0}}{\\frac{${s}}{\\sqrt{${n}}}} = \\frac{${(xbar - mu0).toFixed(2)}}{${se.toFixed(3)}} = ${zCal.toFixed(2)}$$
        </div>
        <div class="solver-step"><strong>ขั้นที่ 4 & 5: การตัดสินใจและสรุปผล</strong><br>
          ${rejectH0 
            ? `<span class="badge danger-badge">❌ ปฏิเสธ H₀ (Reject H₀)</span> เนื่องจาก $Z_{\\text{cal}} = ${zCal.toFixed(2)}$ ตกในเขตวิกฤต แสดงว่าข้อมูลสนับสนุน $H_1$ อย่างมีนัยสำคัญที่ระดับ $\\alpha = ${alpha}$`
            : `<span class="badge info-badge">✅ ยอมรับ H₀ (Fail to reject H₀)</span> เนื่องจาก $Z_{\\text{cal}} = ${zCal.toFixed(2)}$ ไม่ตกในเขตวิกฤต หลักฐานยังไม่เพียงพอที่จะปฏิเสธ $H_0$`
          }
        </div>
      `;

      if (window.renderMathInElement) {
        try {
          window.renderMathInElement(stepsOutput, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn("renderMathInElement error:", e);
        }
      }
    }

    Visualizer.drawNormalCurve("normalCurveCanvas", zCrit, tail, alpha);
  }

  function updateRegressionCanvas() {
    const rawText = document.getElementById("reg_data_input")?.value || "";
    const lines = rawText.trim().split("\n");
    const points = [];

    lines.forEach(l => {
      const parts = l.split(",");
      if (parts.length >= 2) {
        const x = parseFloat(parts[0].trim());
        const y = parseFloat(parts[1].trim());
        if (!isNaN(x) && !isNaN(y)) points.push({ x, y });
      }
    });

    if (points.length < 2) return;

    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
    points.forEach(p => {
      sumX += p.x;
      sumY += p.y;
      sumXY += p.x * p.y;
      sumX2 += p.x * p.x;
      sumY2 += p.y * p.y;
    });

    const denom = n * sumX2 - sumX * sumX;
    if (denom === 0) return;

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const rNumer = n * sumXY - sumX * sumY;
    const rDenom = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = rDenom > 0 ? rNumer / rDenom : 0;
    const r2 = r * r;

    // Update result box
    const resEl = document.getElementById("regressionResultsBox");
    if (resEl) {
      resEl.innerHTML = `
        <div class="reg-metrics-grid">
          <div class="metric-box">
            <span class="m-title">สมการถดถอย</span>
            <span class="m-val highlight">Ŷ = ${intercept.toFixed(2)} + ${slope.toFixed(3)}X</span>
          </div>
          <div class="metric-box">
            <span class="m-title">ความชัน (Slope: b)</span>
            <span class="m-val">${slope.toFixed(3)}</span>
          </div>
          <div class="metric-box">
            <span class="m-title">สหสัมพันธ์ (r)</span>
            <span class="m-val">${r.toFixed(3)}</span>
          </div>
          <div class="metric-box">
            <span class="m-title">สัมประสิทธิ์การตัดสินใจ (r²)</span>
            <span class="m-val">${(r2 * 100).toFixed(1)}%</span>
          </div>
        </div>
        <p class="text-sm mt-2 text-slate-300">
          💡 <strong>แปลความหมาย:</strong> ทุกๆ ครั้งที่ X เพิ่มขึ้น 1 หน่วย Y จะเพิ่มขึ้นเฉลี่ย <strong>${slope.toFixed(3)}</strong> หน่วย และตัวแปร X สามารถอธิบายความผันแปรของ Y ได้ <strong>${(r2 * 100).toFixed(1)}%</strong>
        </p>
      `;
    }

    Visualizer.drawRegressionScatter("regressionCanvas", points, slope, intercept);
  }

  // 8. Practice Arena
  // 8. Practice Arena (เฉลยหลังจากส่งคำตอบแล้วเท่านั้น)
  function initPracticeArena() {
    const container = document.getElementById("practiceArenaList");
    if (!container) return;

    let currentFilter = "all";
    const userSelections = {}; // { [qid]: number } (ตัวเลือกที่นิสิตเลือกไว้ แต่ยังไม่ได้กดยืนยัน)
    const userAnswers = {};    // { [qid]: { oIdx: number, isSubmitted: boolean, isCorrect: boolean } }

    const countText = document.getElementById("practiceCountText");
    const scoreText = document.getElementById("practiceScoreText");

    // Initialize Filter Buttons
    const filterButtons = document.querySelectorAll(".practice-filter-btn");
    filterButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        filterButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderQuestions();
      });
    });

    function updateScoreSummary() {
      const correctCount = Object.values(userAnswers).filter(a => a.isCorrect).length;
      const totalSubmitted = Object.values(userAnswers).filter(a => a.isSubmitted).length;
      if (scoreText) {
        scoreText.innerText = `คะแนนสะสม: ${correctCount} ข้อที่ถูกต้อง (ตรวจแล้ว ${totalSubmitted}/${STATS_DATA.practicePool.length} ข้อ)`;
      }
    }

    function renderQuestions(focusQid = null) {
      let filtered = STATS_DATA.practicePool;
      let label = "ทั้งหมด 90 ข้อ";

      if (currentFilter === "final") {
        const finalChapters = ["ch5", "ch6", "ch7", "ch8", "ch9"];
        filtered = STATS_DATA.practicePool.filter(q => finalChapters.includes(q.chapter));
        label = "เนื้อหา Final (50 ข้อ: บทที่ 5 - 9)";
      } else if (currentFilter.startsWith("ch")) {
        const chNum = currentFilter.replace("ch", "");
        filtered = STATS_DATA.practicePool.filter(q => q.chapter === currentFilter);
        label = `บทที่ ${chNum} (${filtered.length} ข้อ)`;
      }

      if (countText) {
        countText.innerText = `กำลังแสดง: ${label}`;
      }

      container.innerHTML = filtered.map((q) => {
        const ans = userAnswers[q.id];
        const isSubmitted = ans && ans.isSubmitted;
        const currentSel = isSubmitted ? ans.oIdx : userSelections[q.id];
        const correctOptIdx = q.options.findIndex(o => o.isCorrect);

        return `
          <div class="practice-item-card" data-qid="${q.id}" id="card_${q.id}">
            <div class="p-header">
              <span class="badge ${['ch5','ch6','ch7','ch8','ch9'].includes(q.chapter) ? 'danger-badge' : 'slate-badge'}">บทที่ ${q.chapter.replace('ch', '')}</span>
              <span class="p-source">${q.source}</span>
            </div>
            <h3 class="p-title">${q.title}</h3>
            <div class="p-question">${q.question}</div>

            <!-- Options List -->
            <div class="p-options-list">
              ${q.options.map((opt, oIdx) => {
                let optClass = "p-option-item";
                if (!isSubmitted) {
                  if (currentSel === oIdx) optClass += " selected";
                } else {
                  // After submission:
                  if (ans.oIdx === oIdx) {
                    optClass += ans.isCorrect ? " selected correct" : " selected wrong";
                  } else if (!ans.isCorrect && opt.isCorrect) {
                    optClass += " correct-highlight";
                  }
                }
                return `
                  <div class="${optClass}" data-qid="${q.id}" data-oidx="${oIdx}">
                    <span class="opt-bullet">${String.fromCharCode(65 + oIdx)}</span>
                    <span class="opt-text">${opt.text}</span>
                  </div>
                `;
              }).join("")}
            </div>

            <!-- Action Row: Submit or Retry -->
            <div class="p-actions-row">
              ${!isSubmitted ? `
                <button class="btn-submit-answer" data-qid="${q.id}">✉️ ตรวจคำตอบ / ส่งคำตอบ</button>
                <span style="font-size: 0.82rem; color: #94a3b8;">(เลือกข้อ A, B, C หรือ D แล้วกดปุ่มนี้เพื่อส่งคำตอบและเปิดดูเฉลย)</span>
              ` : `
                <div class="submitted-status ${ans.isCorrect ? 'is-correct' : 'is-wrong'}">
                  ${ans.isCorrect ? '🎉 ตอบถูกต้อง (+1 คะแนน)' : '⚠️ ตอบผิด (ดูเฉลยวิธีทำด้านล่าง)'}
                </div>
                <button class="btn-retry-answer" data-qid="${q.id}">↺ ลองทำใหม่อีกครั้ง</button>
              `}
            </div>

            <!-- Feedback Alert Box -->
            <div class="p-feedback-msg ${isSubmitted ? (ans.isCorrect ? 'correct-box' : 'wrong-box') : 'hidden'}" id="feed_${q.id}">
              ${isSubmitted ? (
                ans.isCorrect ?
                  `🎉 <strong>ถูกต้องยอดเยี่ยม!</strong> ${q.explanation}` :
                  `⚠️ <strong>ยังไม่ถูกต้อง:</strong> คำตอบที่ถูกต้องคือ <strong>ข้อ ${String.fromCharCode(65 + correctOptIdx)}: ${q.options[correctOptIdx].text}</strong><br>💡 ${q.explanation}`
              ) : ''}
            </div>

            <!-- Progressive Hints Accordion -->
            <div class="hint-accordion">
              <button class="hint-btn level-1" data-target="h1_${q.id}">💡 คำใบ้ระดับ 1: ชี้เป้าสูตร/แนวคิด</button>
              <div class="hint-content hidden" id="h1_${q.id}">${q.hint1}</div>

              <button class="hint-btn level-2" data-target="h2_${q.id}">🔍 คำใบ้ระดับ 2: จุดสังเกตและการแทนค่า</button>
              <div class="hint-content hidden" id="h2_${q.id}">${q.hint2}</div>

              ${!isSubmitted ? `
                <button class="hint-btn level-3 locked" data-qid="${q.id}">🔒 เฉลยละเอียดทุกขั้นตอน (ส่งคำตอบก่อนเพื่อดูเฉลย)</button>
                <div class="hint-content hidden solution-box" id="h3_${q.id}">
                  <div class="solution-header">📖 วิธีทำและคำอธิบายอย่างละเอียด (ตามหนังสือ อ.ดร.ชัยวัฒน์):</div>
                  ${q.solution.replace(/\n/g, "<br>")}
                </div>
              ` : `
                <button class="hint-btn level-3 unlocked" data-target="h3_${q.id}">🎯 เฉลยละเอียดทุกขั้นตอน (ตามหนังสือ อ.ดร.ชัยวัฒน์)</button>
                <div class="hint-content solution-box" id="h3_${q.id}">
                  <div class="solution-header">📖 วิธีทำและคำอธิบายอย่างละเอียด (ตามหนังสือ อ.ดร.ชัยวัฒน์):</div>
                  ${q.solution.replace(/\n/g, "<br>")}
                </div>
              `}
            </div>
          </div>
        `;
      }).join("");

      // Option click listeners (เลือกคำตอบแต่ยังไม่ส่ง)
      container.querySelectorAll(".p-option-item").forEach(optItem => {
        optItem.addEventListener("click", () => {
          const qId = optItem.dataset.qid;
          if (userAnswers[qId] && userAnswers[qId].isSubmitted) return; // กดยืนยันแล้ว ห้ามกดเปลี่ยนจนกว่าจะกดรีเซ็ต

          const oIdx = parseInt(optItem.dataset.oidx);
          userSelections[qId] = oIdx;

          const card = document.getElementById(`card_${qId}`);
          if (card) {
            card.querySelectorAll(".p-option-item").forEach(i => i.classList.remove("selected"));
            optItem.classList.add("selected");
            // ลบข้อความแจ้งเตือนสีแดงถ้าเคยมี
            const feed = document.getElementById(`feed_${qId}`);
            if (feed && !feed.classList.contains("correct-box")) {
              feed.classList.add("hidden");
            }
          }
        });
      });

      // Submit answer listener (ตรวจคำตอบและปลดล็อคเฉลย)
      container.querySelectorAll(".btn-submit-answer").forEach(btn => {
        btn.addEventListener("click", () => {
          const qId = btn.dataset.qid;
          const selectedIdx = userSelections[qId];

          if (selectedIdx === undefined) {
            const feed = document.getElementById(`feed_${qId}`);
            if (feed) {
              feed.className = "p-feedback-msg wrong-box";
              feed.innerHTML = "⚠️ <strong>กรุณาคลิกเลือกตัวเลือก A, B, C หรือ D</strong> ก่อนกดตรวจคำตอบครับ";
              feed.classList.remove("hidden");
            }
            return;
          }

          const qData = STATS_DATA.practicePool.find(q => q.id === qId);
          if (!qData) return;

          const isCorrect = qData.options[selectedIdx].isCorrect;
          userAnswers[qId] = { oIdx: selectedIdx, isSubmitted: true, isCorrect };

          renderQuestions(qId);
          updateScoreSummary();

          // เลื่อนไปยังข้อที่ตรวจ
          const card = document.getElementById(`card_${qId}`);
          if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      });

      // Retry answer listener (ลองทำข้อนี้ใหม่อีกครั้ง)
      container.querySelectorAll(".btn-retry-answer").forEach(btn => {
        btn.addEventListener("click", () => {
          const qId = btn.dataset.qid;
          delete userAnswers[qId];
          delete userSelections[qId];

          renderQuestions(qId);
          updateScoreSummary();

          const card = document.getElementById(`card_${qId}`);
          if (card) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
      });

      // Hint toggle listeners (ระดับ 1, 2 และระดับ 3 หลังปลดล็อค)
      container.querySelectorAll(".hint-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          if (btn.classList.contains("locked")) {
            const qId = btn.dataset.qid;
            const feed = document.getElementById(`feed_${qId}`);
            if (feed) {
              feed.className = "p-feedback-msg wrong-box";
              feed.innerHTML = "🔒 <strong>เฉลยละเอียดถูกล็อคอยู่:</strong> กรุณาเลือกคำตอบที่คิดว่าถูกต้อง แล้วกดปุ่ม <strong>\"✉️ ตรวจคำตอบ / ส่งคำตอบ\"</strong> ก่อนครับ เพื่อเป็นการฝึกทำข้อสอบจริง!";
              feed.classList.remove("hidden");
            }
            return;
          }

          const targetId = btn.dataset.target;
          const targetEl = document.getElementById(targetId);
          if (targetEl) targetEl.classList.toggle("hidden");
        });
      });

      // Auto-render math expressions in practice questions
      if (window.renderMathInElement) {
        try {
          window.renderMathInElement(container, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn("Practice arena renderMathInElement error:", e);
        }
      }
    }

    renderQuestions();
    updateScoreSummary();
  }

  // 9. Statistical Tables (Z & t Tables)
  function initStatTables() {
    const zContainer = document.getElementById("zTableBody");
    if (zContainer) {
      zContainer.innerHTML = STATS_DATA.statTables.zTable.map(row => `
        <tr>
          <td><strong>${row.z}</strong></td>
          <td>${row.val}</td>
        </tr>
      `).join("");
    }

    const tContainer = document.getElementById("tTableBody");
    if (tContainer) {
      tContainer.innerHTML = STATS_DATA.statTables.tTable.map(row => `
        <tr>
          <td><strong>${row.df}</strong></td>
          <td>${row.t05}</td>
          <td>${row.t025}</td>
          <td>${row.t005}</td>
        </tr>
      `).join("");
    }
  }

  // Simple Modal Helper
  function showModal(title, content) {
    let modal = document.getElementById("appInfoModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "appInfoModal";
      modal.className = "custom-modal-backdrop";
      modal.innerHTML = `
        <div class="custom-modal-box">
          <div class="modal-header">
            <h3 id="modalTitleText"></h3>
            <button class="modal-close-btn">&times;</button>
          </div>
          <div class="modal-body" id="modalBodyText"></div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector(".modal-close-btn").addEventListener("click", () => modal.classList.remove("open"));
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.remove("open");
      });
    }

    document.getElementById("modalTitleText").innerText = title;
    document.getElementById("modalBodyText").innerHTML = content.replace(/\n/g, "<br>");
    modal.classList.add("open");
  }

  // =========================================================================
  // 1.8 VARIABLES GLOSSARY (ถอดรหัสตัวแปรและสัญลักษณ์ในสูตรสถิติ)
  // Complete guide explaining each variable: What it is, How to calculate,
  // Real examples from Dr. Chaiwat's book, and Exam traps!
  // =========================================================================
  function initVariablesGlossary() {
    const gridEl = document.getElementById("variablesGrid");
    const searchInput = document.getElementById("variableSearchInput");
    const clearBtn = document.getElementById("clearVariableSearchBtn");
    const resetBtn = document.getElementById("resetVariablesSearchBtn");
    const emptyCard = document.getElementById("variablesEmptyCard");
    const countBadge = document.getElementById("variablesCountBadge");
    const categoryBtns = document.querySelectorAll("#variablesCategoryPills .var-category-btn");
    const jumpStrip = document.getElementById("jumpSymbolsStrip");

    if (!gridEl || !STATS_DATA.variablesGlossary) return;

    let currentCategory = "all";
    let searchQuery = "";

    // 1. Quick Symbols Jump Strip
    if (jumpStrip) {
      jumpStrip.innerHTML = STATS_DATA.variablesGlossary.map(v => {
        const mathSym = renderMathInline(v.symbol || v.symbolDisplay);
        return `<button class="jump-symbol-pill" data-var-id="${v.id}" title="${v.thaiName} (${v.engName})">${mathSym}</button>`;
      }).join("");

      jumpStrip.querySelectorAll(".jump-symbol-pill").forEach(pill => {
        pill.addEventListener("click", () => {
          const varId = pill.dataset.varId;
          const targetCard = document.getElementById(`card-${varId}`);

          if (targetCard) {
            targetCard.scrollIntoView({ behavior: "smooth", block: "center" });
            targetCard.style.outline = "2px solid #000000";
            targetCard.style.boxShadow = "0 0 30px rgba(15, 23, 42, 0.25)";
            setTimeout(() => {
              targetCard.style.outline = "";
              targetCard.style.boxShadow = "";
            }, 1800);
          } else {
            // If currently filtered out, reset category & search then scroll
            currentCategory = "all";
            searchQuery = "";
            if (searchInput) searchInput.value = "";
            if (clearBtn) clearBtn.style.display = "none";
            categoryBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.cat === "all"));
            renderVariables();

            setTimeout(() => {
              const card = document.getElementById(`card-${varId}`);
              if (card) {
                card.scrollIntoView({ behavior: "smooth", block: "center" });
                card.style.outline = "2px solid #000000";
                card.style.boxShadow = "0 0 30px rgba(15, 23, 42, 0.25)";
                setTimeout(() => {
                  card.style.outline = "";
                  card.style.boxShadow = "";
                }, 1800);
              }
            }, 80);
          }
        });
      });
    }

    // Render KaTeX for Category Pills in Header
    const categoryPillsContainer = document.getElementById("variablesCategoryPills");
    if (categoryPillsContainer && window.renderMathInElement) {
      try {
        window.renderMathInElement(categoryPillsContainer, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false }
          ],
          throwOnError: false
        });
      } catch (err) {
        console.warn("Category pills math render error:", err);
      }
    }

    // 2. Render Variable Cards
    function renderVariables() {
      const allVars = STATS_DATA.variablesGlossary;
      const q = searchQuery.trim().toLowerCase();

      const filtered = allVars.filter(v => {
        // Category Filter
        if (currentCategory !== "all" && v.category !== currentCategory) {
          return false;
        }

        // Live Search Filter
        if (q) {
          const matchSym = (v.symbol || "").toLowerCase().includes(q) || (v.symbolDisplay || "").toLowerCase().includes(q);
          const matchThai = (v.thaiName || "").toLowerCase().includes(q);
          const matchEng = (v.engName || "").toLowerCase().includes(q);
          const matchChap = (v.chapter || "").toLowerCase().includes(q);
          const matchWhat = (v.whatIs || "").toLowerCase().includes(q);
          const matchHow = (v.howToCalculate || "").toLowerCase().includes(q);
          const matchEx = (v.example || "").toLowerCase().includes(q);
          const matchTrap = (v.examTrap || "").toLowerCase().includes(q);
          return matchSym || matchThai || matchEng || matchChap || matchWhat || matchHow || matchEx || matchTrap;
        }

        return true;
      });

      if (countBadge) {
        countBadge.innerText = `กำลังแสดง ${filtered.length} จาก ${allVars.length} ตัวแปร`;
      }

      if (filtered.length === 0) {
        gridEl.innerHTML = "";
        if (emptyCard) emptyCard.style.display = "block";
        return;
      }

      if (emptyCard) emptyCard.style.display = "none";

      gridEl.innerHTML = filtered.map(v => {
        const avatarMath = renderMathInline(v.symbol || v.symbolDisplay);
        const formulaDisplay = renderMathDisplay(v.mathFormula || v.symbol);
        const copyLatex = (v.mathFormula || v.symbol).replace(/"/g, '&quot;');
        return `
          <article class="var-card" id="card-${v.id}" data-category="${v.category}">
            <div class="var-card-header">
              <div class="var-symbol-avatar" title="${v.symbol}">
                ${avatarMath}
              </div>
              <div class="var-title-group">
                <h3 class="var-thai-name">${v.thaiName}</h3>
                <div class="var-eng-name">${v.engName}</div>
                <div class="var-badges-row">
                  <span class="var-chap-badge">${v.chapter}</span>
                  <span class="var-cat-badge">${v.categoryName}</span>
                </div>
              </div>
            </div>

            <!-- Authentic Mathematical Formula Box -->
            <div class="var-card-formula-banner">
              <div class="var-formula-badge-label">
                <span>📐 สูตรคำนวณจริง:</span>
              </div>
              <div class="var-formula-math-display">
                ${formulaDisplay}
              </div>
            </div>

            <div class="var-card-body">
              <!-- 1. What is it? -->
              <div class="var-section-block var-block-what">
                <div class="var-section-label">💡 คืออะไร?</div>
                <div>${v.whatIs}</div>
              </div>

              <!-- 2. How to calculate? -->
              <div class="var-section-block var-block-how">
                <div class="var-section-label">🧮 วิธีคิด / หาค่ายังไง?</div>
                <div>${v.howToCalculate}</div>
              </div>

              <!-- 3. Real textbook example -->
              <div class="var-section-block var-block-example">
                <div class="var-section-label">📖 ตัวอย่างจริงในหนังสือ อ.ดร.ชัยวัฒน์</div>
                <div>${v.example}</div>
              </div>

              <!-- 4. Exam trap -->
              <div class="var-section-block var-block-trap">
                <div class="var-section-label">⚠️ จุดหลอก &amp; ระวังโดนหักคะแนน</div>
                <div>${v.examTrap}</div>
              </div>
            </div>

            <div class="var-card-footer">
              <button class="var-btn-copy" data-symbol="${copyLatex}" title="คัดลอกสูตร LaTeX">
                <span>📋</span> คัดลอกสูตร LaTeX
              </button>
              <button class="var-btn-link" data-search="${v.thaiName}" title="ไปทำโจทย์">
                🎯 ซ้อมโจทย์ที่เกี่ยวข้อง ➔
              </button>
            </div>
          </article>
        `;
      }).join("");

      // Render math formulas in card content
      if (window.renderMathInElement) {
        try {
          window.renderMathInElement(gridEl, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        } catch (e) {
          console.warn("KaTeX render in variablesGrid error:", e);
        }
      }

      // Copy LaTeX buttons
      gridEl.querySelectorAll(".var-btn-copy").forEach(btn => {
        btn.addEventListener("click", () => {
          const sym = btn.getAttribute("data-symbol");
          if (navigator.clipboard) {
            navigator.clipboard.writeText(sym).then(() => {
              const orig = btn.innerHTML;
              btn.innerHTML = `<span>✓</span> คัดลอกแล้ว!`;
              btn.style.borderColor = "#10b981";
              btn.style.color = "#059669";
              setTimeout(() => {
                btn.innerHTML = orig;
                btn.style.borderColor = "";
                btn.style.color = "";
              }, 1400);
            }).catch(() => {
              prompt("คัดลอกโค้ดสูตร LaTeX:", sym);
            });
          } else {
            prompt("คัดลอกโค้ดสูตร LaTeX:", sym);
          }
        });
      });

      // Jump to practice buttons
      gridEl.querySelectorAll(".var-btn-link").forEach(btn => {
        btn.addEventListener("click", () => {
          switchTab("practice");
        });
      });
    }

    // Category button click handlers
    categoryBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        categoryBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentCategory = btn.dataset.cat || "all";
        renderVariables();
      });
    });

    // Debounced search input handler
    let debounceTimer;
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          searchQuery = e.target.value;
          if (clearBtn) {
            clearBtn.style.display = searchQuery ? "block" : "none";
          }
          renderVariables();
        }, 120);
      });
    }

    // Clear search button
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) {
          searchInput.value = "";
          searchQuery = "";
          clearBtn.style.display = "none";
          searchInput.focus();
          renderVariables();
        }
      });
    }

    // Reset button in empty state
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        currentCategory = "all";
        searchQuery = "";
        if (searchInput) {
          searchInput.value = "";
          if (clearBtn) clearBtn.style.display = "none";
        }
        categoryBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.cat === "all"));
        renderVariables();
      });
    }

    // Initial render
    renderVariables();
  }
});
