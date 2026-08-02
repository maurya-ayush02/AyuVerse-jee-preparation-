/* AyuVerse — Scientific Calculator
   A small hand-written tokenizer + recursive-descent parser/evaluator.
   No eval()/Function() anywhere — the site's CSP has no 'unsafe-eval',
   and hand-rolling this is safer and more predictable regardless. */
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
    while (i < input.length) {
      const c = input[i];
      if (c === " ") { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let num = c; i++;
        while (i < input.length && /[0-9.]/.test(input[i])) { num += input[i]; i++; }
        tokens.push({ type: "num", value: parseFloat(num) });
        continue;
      }
      if (/[a-zA-Z]/.test(c)) {
        let word = c; i++;
        while (i < input.length && /[a-zA-Z]/.test(input[i])) { word += input[i]; i++; }
        if (FUNCS.includes(word)) tokens.push({ type: "func", value: word });
        else if (word === "pi") tokens.push({ type: "num", value: Math.PI });
        else if (word === "e") tokens.push({ type: "num", value: Math.E });
        else throw new Error("Unknown token: " + word);
        continue;
      }
      if ("+-*/^%()".includes(c)) { tokens.push({ type: "op", value: c }); i++; continue; }
      throw new Error("Unexpected character: " + c);
    }
    return tokens;
  }

  // ---------------- Recursive-descent parser ----------------
  // expr := term (('+' | '-') term)*
  // term := factor (('*' | '/') factor)*
  // factor := unary ('^' factor)?      (right-assoc power)
  // unary := ('-' | '+') unary | postfix
  // postfix := primary ('%')?
  // primary := number | func '(' expr ')' | '(' expr ')'
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
        const exponent = parseUnary(); // right-associative; also allows 2^-2
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

      if (tok.type === "func") {
        next();
        if (!peek() || peek().value !== "(") throw new Error("Expected ( after " + tok.value);
        next();
        const arg = parseExpr();
        if (!peek() || peek().value !== ")") throw new Error("Expected )");
        next();
        return applyFunc(tok.value, arg);
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
      case "sin": return Math.sin(toRad(arg));
      case "cos": return Math.cos(toRad(arg));
      case "tan": return Math.tan(toRad(arg));
      case "asin": return fromRad(Math.asin(arg));
      case "acos": return fromRad(Math.acos(arg));
      case "atan": return fromRad(Math.atan(arg));
      case "log": return Math.log10(arg);
      case "ln": return Math.log(arg);
      case "sqrt": return Math.sqrt(arg);
      default: throw new Error("Unknown function: " + name);
    }
  }

  function evaluate(input) {
    const tokens = tokenize(input);
    return parse(tokens);
  }

  // ---------------- Display / UI ----------------
  function formatResult(n) {
    if (!isFinite(n)) return "Error";
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
      pushHistory(expr, formatted);
      expr = formatted;
      justEvaluated = true;
      updateDisplay();
    } catch (e) {
      display.textContent = "Error";
      justEvaluated = true;
      setTimeout(() => { expr = ""; justEvaluated = false; updateDisplay(); }, 900);
    }
  }

  // ---------------- Button wiring ----------------
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

  // ---------------- Keyboard support ----------------
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
