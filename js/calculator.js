/* AyuVerse — Production-Grade Scientific Calculator Engine
   CSP Compliant (No eval / Function).
*/
(() => {
  const display = document.getElementById("calcDisplay");
  const expressionEl = document.getElementById("calcExpression");
  const historyList = document.getElementById("calcHistory");
  const modeBtn = document.getElementById("calcMode");
  const displayModeBtn = document.getElementById("calcDisplayMode");
  const calcContainer = document.getElementById("calcContainer") || document.body;

  if (!display || typeof window === "undefined") return;

  let expr = "";
  let degMode = true;
  let displayFormat = "STD"; // "STD", "SCI", "ENG"
  let autoCloseBrackets = false;
  let justEvaluated = false;
  
  // Numerical State Variables (Always Primitive Numbers)
  let memory = 0;
  let ans = 0;

  const FUNCS = [
    "sin", "cos", "tan", "asin", "acos", "atan",
    "sinh", "cosh", "tanh",
    "log", "ln", "sqrt", "cbrt",
    "abs", "floor", "ceil", "round", "rand",
    "sq", "cube", "exp", "pow10", "recip",
    "sign", "trunc", "gamma"
  ];

  const MULTI_ARG_FUNCS = ["gcd", "lcm", "hypot", "max", "min", "nroot"];
  const CONSTS = ["pi", "e", "ans"];

  // --- Math Helpers ---
  function gcd(a, b) {
    if (!Number.isInteger(a) || !Number.isInteger(b)) throw new Error("Domain Error");
    a = Math.abs(a); b = Math.abs(b);
    while (b) { const t = b; b = a % b; a = t; }
    return a;
  }

  function lcm(a, b) {
    if (!Number.isInteger(a) || !Number.isInteger(b)) throw new Error("Domain Error");
    if (a === 0 || b === 0) return 0;
    return Math.abs((a * b) / gcd(a, b));
  }

  function gamma(z) {
    if (z <= 0 && Number.isInteger(z)) throw new Error("Domain Error");
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
    z -= 1;
    const p = [
      0.99999999999980993, 676.5203681218851, -1259.139216722289,
      771.32342877765313, -176.61502916214059, 12.507343278686905,
      -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    let x = p[0];
    for (let i = 1; i < p.length; i++) x += p[i] / (z + i);
    const t = z + p.length - 1.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  function nPr(n, r) {
    if (n < 0 || r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r)) throw new Error("Domain Error");
    let res = 1;
    for (let i = n; i > n - r; i--) res *= i;
    return res;
  }

  function nCr(n, r) {
    if (n < 0 || r < 0 || r > n || !Number.isInteger(n) || !Number.isInteger(r)) throw new Error("Domain Error");
    return nPr(n, r) / factorial(r);
  }

  function factorial(n) {
    if (typeof n !== "number" || !Number.isInteger(n) || n < 0) throw new Error("Domain Error");
    if (n > 170) throw new Error("Overflow");
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  function clampZero(val) {
    return Math.abs(val) < 1e-15 ? 0 : val;
  }

  // --- Display Formatters ---
  function toSuperscript(numStr) {
    const supers = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(numStr).split('').map(c => supers[c] || c).join('');
  }

  function formatScientific(num) {
    if (num === 0) return "0";
    const str = num.toExponential(6);
    const [mantissa, exp] = str.split("e");
    const cleanMantissa = parseFloat(parseFloat(mantissa).toFixed(6));
    return `${cleanMantissa} × 10${toSuperscript(parseInt(exp, 10))}`;
  }

  function formatEngineering(num) {
    if (num === 0) return "0";
    const exp = Math.floor(Math.log10(Math.abs(num)));
    const engExp = Math.floor(exp / 3) * 3;
    const mantissa = num / Math.pow(10, engExp);
    const cleanMantissa = parseFloat(parseFloat(mantissa).toFixed(6));
    return `${cleanMantissa} × 10${toSuperscript(engExp)}`;
  }

  function formatDisplayValue(val) {
    if (displayFormat === "SCI") return formatScientific(val);
    if (displayFormat === "ENG") return formatEngineering(val);
    const rounded = Math.round(val * 1e12) / 1e12;
    return parseFloat(rounded.toFixed(10));
  }

  // ---------------- Tokenizer ----------------
  function tokenize(input) {
    const tokens = [];
    let i = 0;

    input = input.replace(/√/g, "sqrt").toLowerCase();

    while (i < input.length) {
      const c = input[i];
      if (c === " " || c === ",") { 
        if (c === ",") tokens.push({ type: "comma", value: "," });
        i++; 
        continue; 
      }

      if (/[0-9.]/.test(c)) {
        let numStr = "";
        let dotCount = 0;

        while (i < input.length) {
          const char = input[i];
          if (char === ".") {
            dotCount++;
            if (dotCount > 1) throw new Error("Syntax Error");
            numStr += char;
            i++;
          } else if (/[0-9]/.test(char)) {
            numStr += char;
            i++;
          } else if (char === "e") {
            let peekIdx = i + 1;
            let signStr = "";
            if (peekIdx < input.length && (input[peekIdx] === "+" || input[peekIdx] === "-")) {
              signStr = input[peekIdx];
              peekIdx++;
            }
            let expDigits = "";
            while (peekIdx < input.length && /[0-9]/.test(input[peekIdx])) {
              expDigits += input[peekIdx];
              peekIdx++;
            }
            if (expDigits.length > 0) {
              const expVal = parseInt(signStr + expDigits, 10);
              if (Math.abs(expVal) > 308) throw new Error("Overflow");
              numStr += "e" + signStr + expDigits;
              i = peekIdx;
            } else break;
          } else break;
        }

        const numVal = Number(numStr);
        if (isNaN(numVal)) throw new Error("Syntax Error");
        tokens.push({ type: "num", value: numVal });
        continue;
      }

      if (/[a-z]/.test(c)) {
        let word = "";
        while (i < input.length && /[a-z]/.test(input[i])) {
          word += input[i];
          i++;
        }
        if (word === "mod" || word === "npr" || word === "ncr") tokens.push({ type: "op", value: word });
        else if (FUNCS.includes(word) || MULTI_ARG_FUNCS.includes(word)) tokens.push({ type: "func", value: word });
        else if (CONSTS.includes(word)) tokens.push({ type: "const", value: word });
        else throw new Error("Syntax Error");
        continue;
      }

      if ("+-*/^%!()".includes(c)) {
        tokens.push({ type: "op", value: c });
        i++;
        continue;
      }

      throw new Error("Syntax Error");
    }

    if (tokens.length > 1000) throw new Error("Expression Too Long");

    // Implicit Multiplication Insertion (2pi, 2e, 2ans, 2sin30, (2+3)(4+5), 2sqrt9)
    const implicitTokens = [];
    for (let j = 0; j < tokens.length; j++) {
      const curr = tokens[j];
      const prev = tokens[j - 1];

      if (prev) {
        const prevIsVal = prev.type === "num" || prev.type === "const" || 
                          (prev.type === "op" && (prev.value === ")" || prev.value === "!" || prev.value === "%"));
        const currIsVal = curr.type === "num" || curr.type === "const" || curr.type === "func" || 
                          (curr.type === "op" && curr.value === "(");

        if (prevIsVal && currIsVal) {
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

    // Level 1: Addition & Subtraction (Casio Percentage Engine)
    function parseExpr(depth = 0) {
      if (depth > 100) throw new Error("Expression Too Complex"); // Recursion Depth Guard
      
      let left = parseTermNode(depth + 1).value;
      while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "-")) {
        const op = next().value;
        const rightNode = parseTermNode(depth + 1);
        
        let rightVal = rightNode.value;
        if (rightNode.isPercent) {
          rightVal = left * rightNode.value; // 200 + 10% = 220, 200 - 10% = 180
        }

        left = op === "+" ? left + rightVal : left - rightVal;
      }
      return left;
    }

    // Level 2: Multiplication, Division, Modulo, nPr, nCr
    function parseTermNode(depth = 0) {
      let node = parsePowerNode(depth + 1);
      while (peek() && peek().type === "op" && ["*", "/", "mod", "npr", "ncr"].includes(peek().value)) {
        const op = next().value;
        const rightNode = parsePowerNode(depth + 1);
        let val = 0;

        switch (op) {
          case "*": 
            val = node.value * rightNode.value; // 200 * 10% = 20
            break;
          case "/":
            if (rightNode.value === 0) throw new Error("Divide by Zero");
            val = node.value / rightNode.value; // 200 / 10% = 2000
            break;
          case "mod":
            if (rightNode.value === 0) throw new Error("Divide by Zero");
            val = node.value % rightNode.value;
            break;
          case "npr": val = nPr(node.value, rightNode.value); break;
          case "ncr": val = nCr(node.value, rightNode.value); break;
        }
        node = { value: val, isPercent: false };
      }
      return node;
    }

    // Level 3: Exponentiation (Binds higher than Unary Minus: -2^2 = -(2^2) = -4)
    function parsePowerNode(depth = 0) {
      let baseNode = parseUnaryNode(depth + 1);
      if (peek() && peek().type === "op" && peek().value === "^") {
        next();
        const exponentNode = parseUnaryNode(depth + 1); 
        
        if (baseNode.value === 0 && exponentNode.value === 0) throw new Error("Domain Error");
        
        const powVal = Math.pow(baseNode.value, exponentNode.value);
        if (!isFinite(powVal)) throw new Error("Overflow");

        return { value: powVal, isPercent: false };
      }
      return baseNode;
    }

    // Level 4: Unary Prefix Operators (+, -)
    function parseUnaryNode(depth = 0) {
      if (peek() && peek().type === "op" && peek().value === "-") {
        next();
        const sub = parseUnaryNode(depth + 1);
        return { value: -sub.value, isPercent: sub.isPercent };
      }
      if (peek() && peek().type === "op" && peek().value === "+") {
        next();
        return parseUnaryNode(depth + 1);
      }
      return parsePostfixNode(depth + 1);
    }

    // Level 5: Postfix Operations (% and !)
    function parsePostfixNode(depth = 0) {
      let node = parsePrimaryNode(depth + 1);
      
      while (peek() && peek().type === "op" && (peek().value === "%" || peek().value === "!")) {
        const op = next().value;
        if (op === "!") {
          node = { value: factorial(node.value), isPercent: false };
        } else if (op === "%") {
          node = { value: node.value / 100, isPercent: true };
        }
      }
      return node;
    }

    // Level 6: Primaries
    function parsePrimaryNode(depth = 0) {
      const tok = peek();
      if (!tok) throw new Error("Syntax Error");

      if (tok.type === "num") { 
        next(); 
        return { value: tok.value, isPercent: false }; 
      }
      if (tok.type === "const") {
        next();
        let val = 0;
        if (tok.value === "pi") val = Math.PI;
        else if (tok.value === "e") val = Math.E;
        else if (tok.value === "ans") val = ans; // Uses raw numeric ans
        return { value: val, isPercent: false };
      }

      if (tok.type === "func") {
        const funcName = next().value;
        let args = [];

        if (peek() && peek().type === "op" && peek().value === "(") {
          next();
          if (peek() && peek().type === "op" && peek().value === ")") {
            next();
          } else {
            args.push(parseExpr(depth + 1));
            while (peek() && peek().type === "comma") {
              next();
              args.push(parseExpr(depth + 1));
            }
            if (!peek() || peek().value !== ")") throw new Error("Syntax Error");
            next();
          }
        } else {
          args.push(parseUnaryNode(depth + 1).value);
        }

        return { value: applyFunc(funcName, args), isPercent: false };
      }

      if (tok.type === "op" && tok.value === "(") {
        next();
        const val = parseExpr(depth + 1);
        if (!peek() || peek().value !== ")") throw new Error("Syntax Error");
        next();
        return { value: val, isPercent: false };
      }

      throw new Error("Syntax Error");
    }

    const result = parseExpr(0);
    if (pos !== tokens.length) throw new Error("Syntax Error");
    return result;
  }

  // --- Function Evaluator ---
  function applyFunc(name, args) {
    const toRad = (v) => (degMode ? (v * Math.PI) / 180 : v);
    const fromRad = (v) => (degMode ? (v * 180) / Math.PI : v);
    const arg = args[0];

    switch (name) {
      case "sin": return clampZero(Math.sin(toRad(arg)));
      case "cos": return clampZero(Math.cos(toRad(arg)));
      case "tan": {
        const mod = degMode ? Math.abs(arg % 180) : Math.abs((arg * (180 / Math.PI)) % 180);
        if (Math.abs(mod - 90) < 1e-10) throw new Error("Domain Error");
        return clampZero(Math.tan(toRad(arg)));
      }
      case "asin":
        if (arg < -1 || arg > 1) throw new Error("Domain Error");
        return fromRad(Math.asin(arg));
      case "acos":
        if (arg < -1 || arg > 1) throw new Error("Domain Error");
        return fromRad(Math.acos(arg));
      case "atan": return fromRad(Math.atan(arg));
      case "sinh": return Math.sinh(arg);
      case "cosh": return Math.cosh(arg);
      case "tanh": return Math.tanh(arg);
      case "log":
        if (arg <= 0) throw new Error("Domain Error");
        return Math.log10(arg);
      case "ln":
        if (arg <= 0) throw new Error("Domain Error");
        return Math.log(arg);
      case "sqrt":
        if (arg < 0) throw new Error("Domain Error");
        return Math.sqrt(arg);
      case "cbrt": return Math.cbrt(arg);
      case "sq": return Math.pow(arg, 2);
      case "cube": return Math.pow(arg, 3);
      case "pow10": return Math.pow(10, arg);
      case "exp": return Math.exp(arg);
      case "recip":
        if (arg === 0) throw new Error("Divide by Zero");
        return 1 / arg;
      case "abs": return Math.abs(arg);
      case "floor": return Math.floor(arg);
      case "ceil": return Math.ceil(arg);
      case "round": return Math.round(arg);
      case "sign": return Math.sign(arg);
      case "trunc": return Math.trunc(arg);
      case "gamma": return gamma(arg);

      case "rand":
        if (args.length === 0 || args[0] === undefined) return Math.random();
        return Math.random() * args[0];

      case "gcd": return gcd(args[0], args[1]);
      case "lcm": return lcm(args[0], args[1]);
      case "hypot": return Math.hypot(...args);
      case "max": return Math.max(...args);
      case "min": return Math.min(...args);
      case "nroot":
        if (args[1] === 0 || (args[0] < 0 && args[1] % 2 === 0)) throw new Error("Domain Error");
        return Math.pow(args[0], 1 / args[1]);

      default: throw new Error("Syntax Error");
    }
  }

  // Pure Number Evaluator
  function evaluate(input) {
    if (!input.trim()) return 0;
    
    if (autoCloseBrackets) {
      const openB = (input.match(/\(/g) || []).length;
      const closeB = (input.match(/\)/g) || []).length;
      if (openB > closeB) input += ")".repeat(openB - closeB);
    }

    const tokens = tokenize(input);
    const rawResult = parse(tokens);

    if (isNaN(rawResult)) throw new Error("Domain Error");
    if (!isFinite(rawResult)) throw new Error("Overflow");

    return rawResult; // Returns pure numeric primitive
  }

  // ---------------- UI & Display ----------------
  function updateDisplay() {
    display.textContent = expr || "0";
  }

  function pushHistory(originalExpr, rawValue, displayFormattedStr) {
    if (!historyList) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const metaTag = `[${degMode ? "DEG" : "RAD"} | ${displayFormat} | ${timestamp}]`;

    const item = document.createElement("li");
    
    const metaSpan = document.createElement("span");
    metaSpan.className = "calc-history__meta";
    metaSpan.style.fontSize = "0.75em";
    metaSpan.style.opacity = "0.6";
    metaSpan.style.display = "block";
    metaSpan.textContent = metaTag;

    const exprSpan = document.createElement("span");
    exprSpan.className = "calc-history__expr";
    exprSpan.textContent = originalExpr;

    const resSpan = document.createElement("span");
    resSpan.className = "calc-history__result";
    resSpan.textContent = ` = ${displayFormattedStr}`;

    item.appendChild(metaSpan);
    item.appendChild(exprSpan);
    item.appendChild(resSpan);

    item.addEventListener("click", () => {
      expr = originalExpr;
      justEvaluated = false;
      updateDisplay();
    });

    historyList.prepend(item);
    while (historyList.children.length > 20) historyList.removeChild(historyList.lastChild);
  }

  function pressOp(op) {
    if (!expr) {
      if (op === "-") { expr = "-"; updateDisplay(); }
      return;
    }
    if (justEvaluated) justEvaluated = false;

    const last = expr.slice(-1);
    const secondLast = expr.slice(-2, -1);

    if ("+-*/^%".includes(last)) {
      if (op === "-" && last !== "-") {
        expr += op;
      } else if ("+-*/^%".includes(secondLast)) {
        expr = expr.slice(0, -2) + op;
      } else {
        expr = expr.slice(0, -1) + op;
      }
    } else {
      expr += op;
    }

    updateDisplay();
  }

  function press(token) {
    if (justEvaluated && /[0-9.]/.test(token)) expr = "";
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

  function doEquals() {
    if (!expr) return;
    try {
      const originalExpr = expr;
      const rawNumericVal = evaluate(expr); // Returns pure number
      const displayFormattedStr = formatDisplayValue(rawNumericVal);
      
      if (expressionEl) expressionEl.textContent = originalExpr + " =";
      pushHistory(originalExpr, rawNumericVal, displayFormattedStr);
      
      ans = rawNumericVal; // Stores PURE numeric primitive
      expr = String(displayFormattedStr);
      justEvaluated = true;
      updateDisplay();
    } catch (e) {
      display.textContent = e.message || "Error";
      justEvaluated = true;
      setTimeout(() => { expr = ""; justEvaluated = false; updateDisplay(); }, 1400);
    }
  }

  function handleMemory(action) {
    try {
      const currentVal = expr ? evaluate(expr) : 0; // Pure Number
      switch (action) {
        case "MC": memory = 0; break;
        case "MR": 
          if (justEvaluated || !expr || "+-*/^%(".includes(expr.slice(-1))) {
            if (justEvaluated) expr = "";
            expr += String(memory);
          } else {
            expr = String(memory);
          }
          justEvaluated = false; 
          break;
        case "MS": memory = currentVal; justEvaluated = true; break;
        case "M+": memory += currentVal; justEvaluated = true; break;
        case "M-": memory -= currentVal; justEvaluated = true; break;
      }
      updateDisplay();
    } catch (e) {
      display.textContent = "Error";
      setTimeout(updateDisplay, 1000);
    }
  }

  function handleAns() {
    if (justEvaluated || !expr || "+-*/^%(".includes(expr.slice(-1))) {
      if (justEvaluated) expr = "";
      expr += "ans";
    } else {
      expr = "ans";
    }
    justEvaluated = false;
    updateDisplay();
  }

  function handleBackspace() {
    if (justEvaluated) {
      expr = "";
      justEvaluated = false;
    } else {
      expr = expr.slice(0, -1);
    }
    updateDisplay();
  }

  // ---------------- Event Delegation ----------------
  calcContainer.addEventListener("click", (e) => {
    const target = e.target.closest("button");
    if (!target) return;

    const { calcNum, calcOp, calcFunc, calcMem, calcAction } = target.dataset;

    if (calcNum) return press(calcNum);
    if (calcOp) return pressOp(calcOp);
    if (calcFunc) return pressFunc(calcFunc);
    if (calcMem) return handleMemory(calcMem);

    if (calcAction) {
      switch (calcAction) {
        case "equals": return doEquals();
        case "clear":
          expr = ""; justEvaluated = false;
          if (expressionEl) expressionEl.textContent = "";
          break;
        case "backspace": return handleBackspace();
        case "ans": return handleAns();
        case "mode":
          degMode = !degMode;
          if (modeBtn) modeBtn.textContent = degMode ? "DEG" : "RAD";
          return;
        case "displayMode":
          if (displayFormat === "STD") displayFormat = "SCI";
          else if (displayFormat === "SCI") displayFormat = "ENG";
          else displayFormat = "STD";
          if (displayModeBtn) displayModeBtn.textContent = displayFormat;
          if (justEvaluated) doEquals();
          return;
      }
      updateDisplay();
    }
  });

  // Keyboard Shortcuts
  document.addEventListener("keydown", (e) => {
    if (!display || e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
    const key = e.key;
    const lowerKey = key.toLowerCase();

    if (/[0-9.]/.test(key)) {
      press(key);
    } else if (key === "(" || key === ")") {
      press(key);
    } else if ("+-*/^%!".includes(key)) {
      pressOp(key);
    } else if (e.altKey) {
      switch (lowerKey) {
        case "s": pressFunc("sin"); break;
        case "c": pressFunc("cos"); break;
        case "t": pressFunc("tan"); break;
        case "l": pressFunc("log"); break;
        case "n": pressFunc("ln"); break;
        case "r": pressFunc("sqrt"); break;
        case "g": pressFunc("gamma"); break;
        case "h": pressFunc("hypot"); break;
        case "m": pressFunc("max"); break;
        case "i": pressFunc("min"); break;
        case "q": pressFunc("sq"); break;
        case "e": pressFunc("exp"); break;
      }
    } else if (key === "Enter" || key === "=" || e.code === "NumpadEnter") { 
      e.preventDefault(); 
      doEquals(); 
    } else if (key === "Backspace") { 
      handleBackspace(); 
    } else if (key === "Escape") { 
      expr = ""; 
      justEvaluated = false; 
      if (expressionEl) expressionEl.textContent = "";
      updateDisplay(); 
    }
  });

  updateDisplay();
})();
