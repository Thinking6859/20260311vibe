(function () {
  const MIN = 1;
  const MAX = 45;
  const COUNT = 6;
  const FORTUNE_COUNT = 100;

  const numbersWrap = document.getElementById("numbersWrap");
  const placeholder = document.getElementById("placeholder");
  const numbersRow = document.getElementById("numbersRow");
  const numbersCaption = document.getElementById("numbersCaption");
  const bonusWrap = document.getElementById("bonusWrap");
  const bonusBall = document.getElementById("bonusBall");
  const generateBtn = document.getElementById("generateBtn");
  const addSetBtn = document.getElementById("addSetBtn");
  const historySection = document.getElementById("historySection");
  const historyList = document.getElementById("historyList");
  const drumEl = document.getElementById("drum");
  const drumNumber = document.getElementById("drumNumber");
  const drawBtn = document.getElementById("drawBtn");
  const fortuneResult = document.getElementById("fortuneResult");
  const fortuneText = document.getElementById("fortuneText");
  const saveLogEl = document.getElementById("saveLog");

  const fortunes = window.FORTUNES || [];

  function showSaveLog(message, isError) {
    if (!saveLogEl) return;
    saveLogEl.textContent = message;
    saveLogEl.className = "save-log " + (isError ? "save-log--error" : "save-log--ok");
    saveLogEl.hidden = false;
  }

  /**
   * 추첨 결과를 서버 API 통해 Supabase에 저장 (Vercel 환경변수 사용)
   */
  function saveToSupabase(data, opts) {
    if (!data || !opts) return;
    var numbers = data.main.slice();
    numbers.push(data.bonus);
    var body = {
      numbers: numbers,
      source: opts.source,
      fortune_index: opts.fortune_index ?? null,
      fortune_text: opts.fortune_text ?? null
    };
    fetch("/api/save-lotto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    })
      .then(function (res) {
        return res.text().then(function (text) {
          var j;
          try { j = JSON.parse(text); } catch (e) { j = { error: text }; }
          return { ok: res.ok, status: res.status, json: j };
        });
      })
      .then(function (r) {
        if (r.ok) {
          showSaveLog("저장 완료", false);
        } else {
          var msg = (r.json && r.json.error) || r.json.detail || "status " + r.status;
          showSaveLog("저장 실패: " + msg, true);
        }
      })
      .catch(function (err) {
        showSaveLog("저장 요청 실패: " + (err.message || "네트워크 오류"), true);
      });
  }

  /**
   * 시드 기반 난수 (같은 시드 → 같은 번호)
   */
  function seededRandom(seed) {
    var x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * 운세 인덱스(0~99)에 고정된 로또 번호 반환
   */
  function getLottoForFortuneIndex(index) {
    var pool = [];
    for (var n = MIN; n <= MAX; n++) pool.push(n);
    var main = [];
    for (var i = 0; i < COUNT; i++) {
      var seed = index * 1000 + i * 97 + 31;
      var idx = Math.floor(seededRandom(seed) * pool.length);
      main.push(pool[idx]);
      pool.splice(idx, 1);
    }
    main.sort(function (a, b) { return a - b; });
    var bonusSeed = index * 1000 + 999;
    var bonusIdx = Math.floor(seededRandom(bonusSeed) * pool.length);
    return { main: main, bonus: pool[bonusIdx] };
  }

  /**
   * 1 ~ 45 중 겹치지 않는 6개 + 보너스 1개 생성 (보너스는 6개와 중복 없음)
   */
  function generateLottoNumbers() {
    const pool = [];
    for (let i = MIN; i <= MAX; i++) {
      pool.push(i);
    }

    const picked = [];
    for (let i = 0; i < COUNT; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool[idx]);
      pool.splice(idx, 1);
    }
    picked.sort((a, b) => a - b);

    const bonusIdx = Math.floor(Math.random() * pool.length);
    const bonus = pool[bonusIdx];

    return { main: picked, bonus: bonus };
  }

  function createBall(num) {
    const el = document.createElement("span");
    el.className = "ball";
    el.textContent = num;
    el.setAttribute("aria-label", `번호 ${num}`);
    return el;
  }

  function createMiniBall(num) {
    const el = document.createElement("span");
    el.className = "mini-ball";
    el.textContent = num;
    return el;
  }

  function renderNumbers(data, caption) {
    if (numbersCaption) {
      if (caption) {
        numbersCaption.textContent = caption;
        numbersCaption.hidden = false;
      } else {
        numbersCaption.hidden = true;
      }
    }
    placeholder.classList.add("hidden");
    numbersRow.innerHTML = "";
    data.main.forEach(function (n) {
      numbersRow.appendChild(createBall(n));
    });
    bonusWrap.hidden = false;
    bonusBall.textContent = data.bonus;
    bonusBall.setAttribute("aria-label", "보너스 번호 " + data.bonus);
    bonusBall.classList.remove("visible");
    setTimeout(function () {
      numbersRow.querySelectorAll(".ball").forEach(function (el) {
        el.classList.add("visible");
      });
      bonusBall.classList.add("visible");
    }, 700);
  }

  function addToHistory(data) {
    historySection.hidden = false;
    const li = document.createElement("li");
    data.main.forEach(function (n) {
      li.appendChild(createMiniBall(n));
    });
    const bonusSpan = document.createElement("span");
    bonusSpan.className = "history-bonus";
    bonusSpan.textContent = "+";
    li.appendChild(bonusSpan);
    const bonusMini = createMiniBall(data.bonus);
    bonusMini.classList.add("mini-ball-bonus");
    li.appendChild(bonusMini);
    historyList.insertBefore(li, historyList.firstChild);
  }

  function runGenerate() {
    var data = generateLottoNumbers();
    renderNumbers(data);
    addToHistory(data);
    saveToSupabase(data, { source: "random" });
  }

  function runDraw() {
    if (drawBtn.disabled) return;
    drawBtn.disabled = true;
    fortuneResult.hidden = true;
    drumEl.classList.add("drum-spinning");
    var count = 0;
    var maxSpin = 28 + Math.floor(Math.random() * 12);
    var finalPicked = Math.floor(Math.random() * FORTUNE_COUNT) + 1;
    var interval = setInterval(function () {
      count++;
      var show = count < maxSpin ? (Math.floor(Math.random() * FORTUNE_COUNT) + 1) : finalPicked;
      drumNumber.textContent = show;
      if (count >= maxSpin) {
        clearInterval(interval);
        drumEl.classList.remove("drum-spinning");
        drawBtn.disabled = false;
        var index = finalPicked - 1;
        var fortuneStr = fortunes[index] || "오늘의 운세";
        fortuneText.textContent = fortuneStr;
        fortuneResult.hidden = false;
        var lottoData = getLottoForFortuneIndex(index);
        renderNumbers(lottoData, "이 운세에 맞는 추천 번호");
        saveToSupabase(lottoData, {
          source: "fortune",
          fortune_index: finalPicked,
          fortune_text: fortuneStr
        });
      }
    }, 70);
  }

  generateBtn.addEventListener("click", function () {
    if (numbersCaption) numbersCaption.hidden = true;
    runGenerate();
  });
  addSetBtn.addEventListener("click", runGenerate);

  drawBtn.addEventListener("click", runDraw);
})();
