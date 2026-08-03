/* AyuVerse — Scientific Calculator
   Fixed & Enhanced Hand-written tokenizer + recursive-descent parser/evaluator.
   No eval()/Function() — CSP Compliant.
*/
(() => {
  const display = document.getElementById("calcDisplay");
  const expressionEl = document.getElementById("calcExpression");
  const historyList = document.getElementById("calcHistory");
  const modeBtn = document.getElementById("calcMode");
  if (!display || typeof window === "undefined") return;

  let expr = "";
  let degMode = true; // true = degrees, false = radians
  let justEvaluated = false;

  // ---------------- Tokenizer ----------------
  const FUNCS = ["sin", "cos", "tan", "asin", "acos", "atan", "log", "ln", "sqrt"];

  function tokenize(input) {
    const tokens = [];
    let i = 0;

    // Normalize square root symbol prior to tokenization
    input = input.replace(/√/g, "sqrt");

    while (i < input.length) {
      const c = input[i];

      if (c === " ") { i++; continue; }

      // Numbers (including decimals)
      if (/[0-9.]/.test(c)) {
        let num = c; i++;
        while (i < input.length && /[0-9.]/.test(input[i])) { num += input[i]; i++; }
        tokens.push({ type: "num", value: parseFloat(num) });
        continue;
      }

      // Identifiers / Functions / Constants
      if (/[a-zA-Z]/.test(c)) {
        let word = c; i++;
        while (i < input.length && /[a-zA-Z]/.test(input[i])) { word += input[i]; i++; }
        if (FUNCS.includes(word)) tokens.push({ type: "func", value: word });
        else if (word === "pi") tokens.push({ type: "num", value: Math.PI });
        else if (word === "e") tokens.push({ type: "num", value: Math.E });
        else throw new Error("Unknown token: " + word);
        continue;
      }

      // Operators & Parentheses
      if ("+-*/^%()".includes(c)) { tokens.push({ type: "op", value: c }); i++; continue; }
      throw new Error("Unexpected character: " + c);
    }

    // Insert implicit multiplication tokens (e.g., 2pi -> 2 * pi, 2(3) -> 2 * (3), 3sqrt(4) -> 3 * sqrt(4))
    const implicitTokens = [];
    for (let j = 0; j < tokens.length; j++) {
      const curr = tokens[j];
      const prev = tokens[j - 1];

      if (prev) {
        const prevIsValue = prev.type === "num" || (prev.type === "op" && prev.value === ")");
        const currIsValue = curr.type === "num" || curr.type === "func" || (curr.type === "op" && curr.value === "(");

        if (prevIsValue && currIsValue) {
          implicitTokens.push({ type: "op", value: "*" });
        }
      }
      implicitTokens.push(curr);
    }

    return implicitTokens;
  }

  // ---------------- Recursive-Descent Parser ----------------
  function parse(tokens) {
    let pos = 0;
    const peek = () => tokens[pos];
    const next = () => tokens[pos++];

    function parseExpr() {
      let left = parseTerm();
      while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        const op = next().value;
        const right = parseTerm();
        left = op === "+" ? left + right : left - right;
      }
      return left;
    }

    function parseTerm() {
      let left = parseUnary();
      while (peek() && peek().type === "op" && (peek().value === "*" || peek().value === "/")) {
        const op = next().value;
        const right = parseUnary();
        left = op === "*" ? left * right : left / right;
      }
      return left;
    }

    function parseUnary() {
      if (peek() && peek().type === "op" && peek().value === "-") { next(); return -parseUnary(); }
      if (peek() && peek().type === "op" && peek().value === "+") { next(); return parseUnary(); }
      return parsePower();
    }

    function parsePower() {
      const base = parsePostfix();
      if (peek() && peek().type === "op" && peek().value === "^") {
        next();
        const exponent = parseUnary(); // Right-associative exponentiation
        return Math.pow(base, exponent);
      }
      return base;
    }

    function parsePostfix() {
      let val = parsePrimary();
      while (peek() && peek().type === "op" && peek().value === "%") {
        next();
        val = val / 100;
      }
      return val;
    }

    function parsePrimary() {
      const tok = peek();
      if (!tok) throw new Error("Unexpected end of expression");

      if (tok.type === "num") { next(); return tok.value; }

      // Handle functions: supports both func(expr) and func expr (e.g., sqrt 9)
      if (tok.type === "func") {
        const funcName = next().value;
        let arg;
        if (peek() && peek().type === "op" && peek().value === "(") {
          next(); // Consume '('
          arg = parseExpr();
          if (!peek() || peek().value !== ")") throw new Error("Expected )");
          next(); // Consume ')'
        } else {
          arg = parseUnary();
        }
        return applyFunc(funcName, arg);
      }

      if (tok.type === "op" && tok.value === "(") {
        next();
        const val = parseExpr();
        if (!peek() || peek().value !== ")") throw new Error("Expected )");
        next();
        return val;
      }

      throw new Error("Unexpected token: " + tok.value);
    }

    const result = parseExpr();
    if (pos !== tokens.length) throw new Error("Unexpected trailing input");
    return result;
  }

  function applyFunc(name, arg) {
    const toRad = (v) => (degMode ? (v * Math.PI) / 180 : v);
    const fromRad = (v) => (degMode ? (v * 180) / Math.PI : v);

    switch (name) {
      case "sin": {
        const rad = toRad(arg);
        // Correct precision issues for sin(180deg), sin(360deg), etc.
        const val = Math.sin(rad);
        return Math.abs(val) < 1e-15 ? 0 : val;
      }
      case "cos": {
        const rad = toRad(arg);
        // Correct precision issues for cos(90deg), cos(270deg), etc.
        const val = Math.cos(rad);
        return Math.abs(val) < 1e-15 ? 0 : val;
      }
      case "tan": {
        if (degMode && Math.abs(arg % 180) === 90) throw new Error("Undefined (tan 90°)");
        const rad = toRad(arg);
        return Math.tan(rad);
      }
      case "asin": return fromRad(Math.asin(arg));
      case "acos": return fromRad(Math.acos(arg));
      case "atan": return fromRad(Math.atan(arg));
      case "log": 
        if (arg <= 0) throw new Error("Domain Error");
        return Math.log10(arg);
      case "ln": 
        if (arg <= 0) throw new Error("Domain Error");
        return Math.log(arg);
      case "sqrt": 
        if (arg < 0) throw new Error("Domain Error");
        return Math.sqrt(arg);
      default: throw new Error("Unknown function: " + name);
    }
  }

  function evaluate(input) {
    const tokens = tokenize(input);
    return parse(tokens);
  }

  // ---------------- Display / UI ----------------
  function formatResult(n) {
    if (!isFinite(n) || isNaN(n)) return "Error";
    if (Number.isInteger(n)) return String(n);
    return String(Math.round(n * 1e10) / 1e10);
  }

  function updateDisplay() {
    display.textContent = expr || "0";
  }

  function pushHistory(inputStr, resultStr) {
    if (!historyList) return;
    const item = document.createElement("li");
    item.innerHTML = `<span class="calc-history__expr">${inputStr}</span><span class="calc-history__result">= ${resultStr}</span>`;
    item.addEventListener("click", () => {
      expr = resultStr;
      justEvaluated = false;
      updateDisplay();
    });
    historyList.prepend(item);
    while (historyList.children.length > 12) historyList.removeChild(historyList.lastChild);
  }

  function press(token) {
    if (justEvaluated && /[0-9.]/.test(token)) { expr = ""; }
    else if (justEvaluated && "+-*/^%".includes(token)) { /* continue from result */ }
    justEvaluated = false;
    expr += token;
    updateDisplay();
  }

  function pressFunc(fn) {
    if (justEvaluated) expr = "";
    justEvaluated = false;
    expr += fn + "(";
    updateDisplay();
  }

  function clearAll() {
    expr = "";
    justEvaluated = false;
    if (expressionEl) expressionEl.textContent = "";
    updateDisplay();
  }

  function backspace() {
    expr = expr.slice(0, -1);
    justEvaluated = false;
    updateDisplay();
  }

  function doEquals() {
    if (!expr) return;
    try {
      const result = evaluate(expr);
      const formatted = formatResult(result);
      if (expressionEl) expressionEl.textContent = expr + " =";
      pushHistory(expr, formatted);
      expr = formatted;
      justEvaluated = true;
      updateDisplay();
    } catch (e) {
      display.textContent = "Error";
      justEvaluated = true;
      setTimeout(() => { expr = ""; justEvaluated = false; updateDisplay(); }, 1200);
    }
  }

  // ---------------- Button Wiring ----------------
  document.querySelectorAll("[data-calc-num]").forEach((btn) => {
    btn.addEventListener("click", () => press(btn.dataset.calcNum));
  });
  document.querySelectorAll("[data-calc-op]").forEach((btn) => {
    btn.addEventListener("click", () => press(btn.dataset.calcOp));
  });
  document.querySelectorAll("[data-calc-func]").forEach((btn) => {
    btn.addEventListener("click", () => pressFunc(btn.dataset.calcFunc));
  });
  const constPi = document.getElementById("calcPi");
  if (constPi) constPi.addEventListener("click", () => press("pi"));
  const constE = document.getElementById("calcE");
  if (constE) constE.addEventListener("click", () => press("e"));

  const clearBtn = document.getElementById("calcClear");
  if (clearBtn) clearBtn.addEventListener("click", clearAll);
  const backBtn = document.getElementById("calcBackspace");
  if (backBtn) backBtn.addEventListener("click", backspace);
  const equalsBtn = document.getElementById("calcEquals");
  if (equalsBtn) equalsBtn.addEventListener("click", doEquals);

  if (modeBtn) {
    modeBtn.addEventListener("click", () => {
      degMode = !degMode;
      modeBtn.textContent = degMode ? "DEG" : "RAD";
    });
  }

  // ---------------- Keyboard Support ----------------
  document.addEventListener("keydown", (e) => {
    if (!display) return;
    if (/[0-9.]/.test(e.key)) { press(e.key); return; }
    if ("+-*/^%()".includes(e.key)) { press(e.key); return; }
    if (e.key === "Enter" || e.key === "=") { e.preventDefault(); doEquals(); return; }
    if (e.key === "Backspace") { backspace(); return; }
    if (e.key === "Escape") { clearAll(); return; }
  });

  updateDisplay();
})();
