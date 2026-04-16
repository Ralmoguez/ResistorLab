import { useState, useEffect, useRef, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const MAROON = "#800000";
const GOLD = "#C9A84C";
const GOLD_LIGHT = "#F0C040";
const BG = "#0d0d0d";
const SURFACE = "#141414";
const SURFACE2 = "#1a1a1a";
const BORDER = "#2a2a2a";
const TEXT = "#e8e8e8";
const MUTED = "#888";

const MATERIALS = {
  Copper:    { rho: 1.68e-8, alpha: 0.00393, color: "#b87333" },
  Aluminum:  { rho: 2.82e-8, alpha: 0.00429, color: "#a8a9ad" },
  Nichrome:  { rho: 1.10e-6, alpha: 0.00040, color: "#727272" },
  Silver:    { rho: 1.59e-8, alpha: 0.00380, color: "#c0c0c0" },
};

const BAND_COLORS = [
  { name: "Black",  val: 0,  mult: 1,      tol: null,  hex: "#1a1a1a", textColor: "#fff" },
  { name: "Brown",  val: 1,  mult: 10,     tol: "±1%", hex: "#6B3A2A", textColor: "#fff" },
  { name: "Red",    val: 2,  mult: 100,    tol: "±2%", hex: "#cc0000", textColor: "#fff" },
  { name: "Orange", val: 3,  mult: 1000,   tol: null,  hex: "#ff8000", textColor: "#000" },
  { name: "Yellow", val: 4,  mult: 10000,  tol: null,  hex: "#f0e010", textColor: "#000" },
  { name: "Green",  val: 5,  mult: 100000, tol: "±0.5%", hex: "#007700", textColor: "#fff" },
  { name: "Blue",   val: 6,  mult: 1e6,    tol: "±0.25%", hex: "#0000cc", textColor: "#fff" },
  { name: "Violet", val: 7,  mult: 1e7,    tol: "±0.1%", hex: "#8800cc", textColor: "#fff" },
  { name: "Gray",   val: 8,  mult: 1e8,    tol: "±0.05%", hex: "#888888", textColor: "#fff" },
  { name: "White",  val: 9,  mult: 1e9,    tol: null,  hex: "#f5f5f5", textColor: "#000" },
  { name: "Gold",   val: null,mult: 0.1,   tol: "±5%", hex: "#C9A84C", textColor: "#000" },
  { name: "Silver", val: null,mult: 0.01,  tol: "±10%",hex: "#c0c0c0", textColor: "#000" },
];

function formatR(r) {
  if (r >= 1e6) return (r/1e6).toFixed(3) + " MΩ";
  if (r >= 1e3) return (r/1e3).toFixed(3) + " kΩ";
  return r.toFixed(4) + " Ω";
}

function Digit({ label, value, unit, sub }) {
  return (
    <div style={{ background: "#0a0a0a", border: `1px solid ${GOLD}33`, borderRadius: 8, padding: "10px 16px", minWidth: 130, textAlign: "center" }}>
      <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, fontFamily: "monospace", marginBottom: 2 }}>{label}</div>
      <div style={{ color: GOLD_LIGHT, fontSize: 26, fontFamily: "monospace", fontWeight: 700, letterSpacing: 1 }}>{value}</div>
      <div style={{ color: MUTED, fontSize: 11, fontFamily: "monospace" }}>{unit}{sub && <span style={{ fontSize: 9 }}>{sub}</span>}</div>
    </div>
  );
}

// ─── TAB 1: WIRE SIMULATOR ────────────────────────────────────────────────────
function WireSimulator() {
  const [length, setLength] = useState(50);
  const [area, setArea] = useState(1.0);
  const [voltage, setVoltage] = useState(5);
  const [temp, setTemp] = useState(20);
  const [material, setMaterial] = useState("Copper");
  const [dataLog, setDataLog] = useState([]);
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);

  const mat = MATERIALS[material];
  const L_m = length / 100;
  const A_m2 = area * 1e-6;
  const R0 = mat.rho * L_m / A_m2;
  const Rt = R0 * (1 + mat.alpha * (temp - 20));
  const I = voltage / Rt;
  const P = voltage * I;

  const wireW = Math.max(8, Math.min(60, area * 14));
  const wireL = Math.max(100, Math.min(440, length * 4.4));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const wireY = H / 2;
    const wireX0 = (W - wireL) / 2;
    const wireX1 = wireX0 + wireL;

    const speed = Math.min(8, Math.max(0.3, I * 2));
    if (particlesRef.current.length < 18) {
      for (let i = particlesRef.current.length; i < 18; i++) {
        particlesRef.current.push({ x: wireX0 + Math.random() * wireL, y: wireY + (Math.random() - 0.5) * wireW * 0.5 });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // Wire body
      const grad = ctx.createLinearGradient(0, wireY - wireW / 2, 0, wireY + wireW / 2);
      grad.addColorStop(0, mat.color + "cc");
      grad.addColorStop(0.4, mat.color);
      grad.addColorStop(1, mat.color + "66");
      ctx.beginPath();
      ctx.roundRect(wireX0, wireY - wireW / 2, wireL, wireW, 4);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = GOLD + "55";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Electrons
      particlesRef.current.forEach(p => {
        p.x += speed;
        if (p.x > wireX1) p.x = wireX0 + (p.x - wireX1);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#80cfff";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
      });

      // End caps
      ctx.beginPath();
      ctx.arc(wireX0, wireY, wireW / 2 + 3, 0, Math.PI * 2);
      ctx.fillStyle = "#c0c0c0";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(wireX1, wireY, wireW / 2 + 3, 0, Math.PI * 2);
      ctx.fillStyle = "#c0c0c0";
      ctx.fill();

      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [length, area, material, I, wireW, wireL, mat]);

  const handleRecord = () => {
    setDataLog(prev => [...prev.slice(-14), { L: length, R: parseFloat(Rt.toFixed(4)), I: parseFloat(I.toFixed(4)), V: voltage, mat: material }]);
  };

  const chartData = dataLog.map(d => ({ L: d.L, R: parseFloat(d.R) }));

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {/* Controls */}
      <div style={{ minWidth: 260, flex: "0 0 260px", background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16 }}>
        <div style={{ color: GOLD, fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>MATERIAL</div>
        <select value={material} onChange={e => setMaterial(e.target.value)}
          style={{ width: "100%", background: SURFACE2, color: TEXT, border: `1px solid ${GOLD}44`, borderRadius: 6, padding: "6px 10px", fontSize: 14, marginBottom: 16 }}>
          {Object.keys(MATERIALS).map(m => <option key={m}>{m}</option>)}
        </select>
        <div style={{ color: GOLD, fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>PARAMETERS</div>
        {[
          { label: "Length (L)", unit: "cm", val: length, set: setLength, min: 5, max: 200, step: 1 },
          { label: "Area (A)", unit: "mm²", val: area, set: setArea, min: 0.1, max: 10, step: 0.1 },
          { label: "Voltage (V)", unit: "V", val: voltage, set: setVoltage, min: 0.1, max: 24, step: 0.1 },
          { label: "Temperature", unit: "°C", val: temp, set: setTemp, min: -50, max: 200, step: 1 },
        ].map(({ label, unit, val, set, min, max, step }) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: MUTED, fontSize: 12 }}>{label}</span>
              <span style={{ color: GOLD_LIGHT, fontSize: 13, fontFamily: "monospace" }}>{typeof val === "number" ? val.toFixed(step < 1 ? 1 : 0) : val} {unit}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={val}
              onChange={e => set(parseFloat(e.target.value))}
              style={{ width: "100%", accentColor: GOLD }} />
          </div>
        ))}
        <div style={{ marginTop: 10, padding: "8px 10px", background: SURFACE2, borderRadius: 6, fontSize: 11, color: MUTED }}>
          <div>ρ = {mat.rho.toExponential(2)} Ω·m</div>
          <div>α = {mat.alpha} /°C</div>
        </div>
      </div>

      {/* Main viz */}
      <div style={{ flex: 1, minWidth: 320 }}>
        {/* Meters */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
          <Digit label="RESISTANCE" value={Rt < 1000 ? Rt.toFixed(3) : (Rt/1000).toFixed(3)} unit={Rt < 1000 ? "Ω" : "kΩ"} />
          <Digit label="CURRENT" value={I < 0.001 ? (I*1e6).toFixed(2) : I < 1 ? (I*1000).toFixed(2) : I.toFixed(3)} unit={I < 0.001 ? "μA" : I < 1 ? "mA" : "A"} />
          <Digit label="POWER" value={P < 0.001 ? (P*1000).toFixed(3) : P.toFixed(4)} unit={P < 0.001 ? "mW" : "W"} />
        </div>

        {/* Wire canvas */}
        <div style={{ background: "#050505", border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>WIRE SIMULATION — {material.toUpperCase()}</div>
          <canvas ref={canvasRef} width={500} height={120} style={{ width: "100%", borderRadius: 6 }} />
          <div style={{ display: "flex", justifyContent: "space-between", color: MUTED, fontSize: 10, marginTop: 6 }}>
            <span>← Length: {length} cm →</span>
            <span>Cross-section: {area} mm² | Electrons ∝ I = {I.toFixed(3)} A</span>
          </div>
        </div>

        {/* Formulas */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>LIVE EQUATIONS</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "R = ρL/A", val: `${mat.rho.toExponential(2)} × ${(L_m).toFixed(3)} / ${A_m2.toExponential(2)} = ${R0.toFixed(4)} Ω` },
              { label: "Rₜ = R₀[1+α(T−T₀)]", val: `${R0.toFixed(4)}[1+${mat.alpha}(${temp}−20)] = ${Rt.toFixed(4)} Ω` },
            ].map(({ label, val }) => (
              <div key={label} style={{ flex: 1, minWidth: 200, background: "#0a0a0a", borderRadius: 6, padding: "8px 12px" }}>
                <div style={{ color: GOLD, fontSize: 11, fontFamily: "monospace" }}>{label}</div>
                <div style={{ color: "#9cc", fontSize: 10, fontFamily: "monospace", marginTop: 3 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Record & Graph */}
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: GOLD, fontSize: 10, letterSpacing: 2 }}>R vs LENGTH GRAPH</span>
              <button onClick={handleRecord} style={{ background: MAROON, color: "#fff", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
                ● RECORD
              </button>
            </div>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={[...chartData].sort((a,b) => a.L - b.L)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="L" stroke={MUTED} tick={{ fontSize: 10 }} label={{ value: "L (cm)", position: "insideBottom", offset: -2, fill: MUTED, fontSize: 10 }} />
                  <YAxis stroke={MUTED} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ background: SURFACE2, border: `1px solid ${GOLD}44`, color: TEXT, fontSize: 11 }} />
                  <Line type="monotone" dataKey="R" stroke={GOLD_LIGHT} strokeWidth={2} dot={{ fill: GOLD }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 12 }}>Record data points to build graph</div>
            )}
          </div>
          {dataLog.length > 0 && (
            <div style={{ flex: 1, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 12, overflow: "auto", maxHeight: 220 }}>
              <div style={{ color: GOLD, fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>DATA LOG</div>
              <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
                <thead><tr>{["L(cm)","R(Ω)","I(A)","V","Mat"].map(h => <th key={h} style={{ color: GOLD, padding: "2px 6px", textAlign: "left", borderBottom: `1px solid ${BORDER}` }}>{h}</th>)}</tr></thead>
                <tbody>{dataLog.map((d, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#0a0a0a" : "transparent" }}>
                    <td style={{ color: TEXT, padding: "2px 6px", fontFamily: "monospace" }}>{d.L}</td>
                    <td style={{ color: GOLD_LIGHT, padding: "2px 6px", fontFamily: "monospace" }}>{d.R}</td>
                    <td style={{ color: "#80cfff", padding: "2px 6px", fontFamily: "monospace" }}>{d.I}</td>
                    <td style={{ color: TEXT, padding: "2px 6px", fontFamily: "monospace" }}>{d.V}</td>
                    <td style={{ color: MUTED, padding: "2px 6px" }}>{d.mat.slice(0,2)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: COLOR CODE DECODER ────────────────────────────────────────────────
function ColorCodeDecoder() {
  const [bands4, setBands4] = useState([4, 7, 1, 10]); // Yellow Violet Brown Gold
  const [bands5, setBands5] = useState([4, 7, 0, 1, 10]);
  const [mode, setMode] = useState(4);

  const calc4 = () => {
    const [b1, b2, b3, b4] = bands4;
    const val = (BAND_COLORS[b1].val * 10 + BAND_COLORS[b2].val) * BAND_COLORS[b3].mult;
    const tol = BAND_COLORS[b4].tol || "—";
    return { val, tol };
  };
  const calc5 = () => {
    const [b1, b2, b3, b4, b5] = bands5;
    const val = (BAND_COLORS[b1].val * 100 + BAND_COLORS[b2].val * 10 + BAND_COLORS[b3].val) * BAND_COLORS[b4].mult;
    const tol = BAND_COLORS[b5].tol || "—";
    return { val, tol };
  };

  const { val, tol } = mode === 4 ? calc4() : calc5();
  const bands = mode === 4 ? bands4 : bands5;
  const setBands = mode === 4 ? setBands4 : setBands5;

  const multOnly = BAND_COLORS.filter(c => c.mult !== undefined);
  const tolOnly = BAND_COLORS.filter(c => c.tol !== null);
  const digOnly = BAND_COLORS.filter(c => c.val !== null);

  function BandSelect({ idx, validColors }) {
    const current = bands[idx];
    return (
      <select value={current}
        onChange={e => { const nb = [...bands]; nb[idx] = parseInt(e.target.value); setBands(nb); }}
        style={{ background: BAND_COLORS[current].hex, color: BAND_COLORS[current].textColor, border: "2px solid #555", borderRadius: 6, padding: "4px 6px", fontSize: 12, fontWeight: 700, cursor: "pointer", width: 90 }}>
        {validColors.map(c => (
          <option key={c.name} value={BAND_COLORS.indexOf(c)} style={{ background: c.hex, color: c.textColor }}>{c.name}</option>
        ))}
      </select>
    );
  }

  const bandData = mode === 4 ? bands4 : bands5;
  const numDigitBands = mode === 4 ? 2 : 3;

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: "center" }}>
        {[4, 5].map(n => (
          <button key={n} onClick={() => setMode(n)}
            style={{ background: mode === n ? MAROON : SURFACE2, color: mode === n ? "#fff" : MUTED, border: `1px solid ${mode === n ? MAROON : BORDER}`, borderRadius: 8, padding: "8px 24px", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>
            {n}-Band
          </button>
        ))}
      </div>

      {/* Resistor SVG */}
      <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
        <svg width="100%" viewBox="0 0 500 120" style={{ display: "block" }}>
          {/* Leads */}
          <line x1="0" y1="60" x2="90" y2="60" stroke="#c0c0c0" strokeWidth="4" strokeLinecap="round"/>
          <line x1="410" y1="60" x2="500" y2="60" stroke="#c0c0c0" strokeWidth="4" strokeLinecap="round"/>
          {/* Body */}
          <rect x="90" y="30" width="320" height="60" rx="12" fill="#d4a96a"/>
          <rect x="90" y="30" width="320" height="60" rx="12" fill="none" stroke="#8B6914" strokeWidth="1.5"/>
          {/* Bands */}
          {bandData.map((bi, i) => {
            const totalBands = mode;
            const spacing = 320 / (totalBands + 1);
            const x = 90 + spacing * (i + 1) - 12;
            const isTolBand = i === totalBands - 1;
            return (
              <g key={i}>
                <rect x={x} y="30" width="24" height="60" fill={BAND_COLORS[bi].hex} opacity={isTolBand ? 0.9 : 1}
                  stroke={isTolBand ? "#fff5" : "none"} strokeWidth={isTolBand ? 1 : 0}/>
              </g>
            );
          })}
          {/* Tolerance gap marker */}
          <line x1="375" y1="20" x2="375" y2="100" stroke="#fff3" strokeWidth="1" strokeDasharray="3 3"/>
        </svg>
      </div>

      {/* Band selectors */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginBottom: 20 }}>
        {bandData.map((bi, i) => {
          const isLastBand = i === bandData.length - 1;
          const isMultBand = mode === 4 ? i === 2 : i === 3;
          const validColors = isLastBand ? tolOnly : isMultBand ? multOnly : digOnly;
          return (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ color: MUTED, fontSize: 10, marginBottom: 4 }}>
                {isLastBand ? "Tolerance" : isMultBand ? "Multiplier" : `Digit ${i + 1}`}
              </div>
              <BandSelect idx={i} validColors={validColors} />
              <div style={{ color: GOLD, fontSize: 10, marginTop: 4, fontFamily: "monospace" }}>
                {isLastBand ? tol : isMultBand ? `×${BAND_COLORS[bi].mult}` : BAND_COLORS[bi].val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Result */}
      <div style={{ background: "#0a0a0a", border: `2px solid ${GOLD}`, borderRadius: 12, padding: 20, textAlign: "center" }}>
        <div style={{ color: MUTED, fontSize: 12, letterSpacing: 2, marginBottom: 8 }}>RESISTANCE VALUE</div>
        <div style={{ color: GOLD_LIGHT, fontSize: 42, fontFamily: "monospace", fontWeight: 700 }}>{formatR(val)}</div>
        <div style={{ color: MUTED, fontSize: 14, marginTop: 6 }}>Tolerance: <span style={{ color: GOLD }}>{tol}</span></div>
        <div style={{ color: MUTED, fontSize: 11, marginTop: 10 }}>
          Range: {formatR(val * (1 - parseFloat(tol || "0%") / 100))} — {formatR(val * (1 + parseFloat(tol || "0%") / 100))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 3: PROBLEM SOLVING ────────────────────────────────────────────────────
function ProblemSolving() {
  const [showObjectives, setShowObjectives] = useState(true);
  const [answers, setAnswers] = useState(["", "", ["", "", "", ""]]);
  const [results, setResults] = useState([null, null, null]);

  const PROBLEMS = [
    {
      title: "P1 — Resistivity",
      desc: "Nichrome wire: L = 50 cm, A = 0.5 mm², T = 20°C",
      question: "What is the resistance? (Ω)",
      type: "number",
      correct: 1.1,
      tolerance: 0.05,
      formula: [
        { step: "Formula", eq: "R = ρL / A" },
        { step: "Values", eq: "ρ = 1.10×10⁻⁶ Ω·m, L = 0.50 m, A = 0.5×10⁻⁶ m²" },
        { step: "Compute", eq: "R = (1.10×10⁻⁶ × 0.50) / (0.5×10⁻⁶)" },
        { step: "Result", eq: "R = 5.5×10⁻⁷ / 5×10⁻⁷ = 1.10 Ω" },
      ]
    },
    {
      title: "P2 — Temperature Coefficient",
      desc: "Copper wire: R₀ = 10 Ω at 20°C, α = 0.00393, T = 120°C",
      question: "New resistance Rₜ? (Ω)",
      type: "number",
      correct: 13.93,
      tolerance: 0.1,
      formula: [
        { step: "Formula", eq: "Rₜ = R₀ [1 + α(T − T₀)]" },
        { step: "Values", eq: "R₀ = 10 Ω, α = 0.00393, T = 120°C, T₀ = 20°C" },
        { step: "Compute", eq: "Rₜ = 10 × [1 + 0.00393 × 100]" },
        { step: "Simplify", eq: "Rₜ = 10 × [1 + 0.393] = 10 × 1.393" },
        { step: "Result", eq: "Rₜ = 13.93 Ω" },
      ]
    },
    {
      title: "P3 — Color Codes",
      desc: "4-band resistor: 4.7 kΩ ±5%",
      question: "Select the correct 4-band sequence:",
      type: "dropdown",
      correct: ["Yellow", "Violet", "Red", "Gold"],
      formula: [
        { step: "Target", eq: "4700 Ω = 4.7 kΩ" },
        { step: "Digit 1", eq: "4 → Yellow" },
        { step: "Digit 2", eq: "7 → Violet" },
        { step: "Multiplier", eq: "×100 → Red" },
        { step: "Tolerance", eq: "±5% → Gold" },
      ]
    }
  ];

  const checkAnswer = (i) => {
    const p = PROBLEMS[i];
    let correct = false;
    if (p.type === "number") {
      const val = parseFloat(answers[i]);
      correct = Math.abs(val - p.correct) <= p.tolerance;
    } else {
      correct = JSON.stringify(answers[2]) === JSON.stringify(p.correct);
    }
    const nr = [...results]; nr[i] = correct; setResults(nr);
  };

  const dropdownBands = ["Black","Brown","Red","Orange","Yellow","Green","Blue","Violet","Gray","White","Gold","Silver"];
  const tolBands = ["Brown","Red","Green","Blue","Violet","Gray","Gold","Silver"];

  return (
    <div style={{ display: "flex", gap: 16 }}>
      {/* Objectives sidebar */}
      {showObjectives && (
        <div style={{ width: 200, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, flexShrink: 0 }}>
          <div style={{ color: GOLD, fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>OBJECTIVES</div>
          {[
            "Apply R = ρL/A",
            "Use Rₜ = R₀[1+α(T−T₀)]",
            "Decode resistor bands",
            "Analyze temp effects",
            "Calculate power P=VI",
          ].map((o, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "flex-start" }}>
              <span style={{ color: MAROON, fontWeight: 700, fontSize: 14 }}>◆</span>
              <span style={{ color: TEXT, fontSize: 12, lineHeight: 1.4 }}>{o}</span>
            </div>
          ))}
          <button onClick={() => setShowObjectives(false)} style={{ marginTop: 10, width: "100%", background: "transparent", color: MUTED, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 11 }}>Hide</button>
        </div>
      )}

      {/* Problems */}
      <div style={{ flex: 1 }}>
        {!showObjectives && (
          <button onClick={() => setShowObjectives(true)} style={{ marginBottom: 12, background: "transparent", color: GOLD, border: `1px solid ${GOLD}44`, borderRadius: 6, padding: "4px 12px", cursor: "pointer", fontSize: 11 }}>▶ Show Objectives</button>
        )}
        {PROBLEMS.map((p, i) => (
          <div key={i} style={{ background: SURFACE, border: `1px solid ${results[i] === true ? GOLD : results[i] === false ? MAROON : BORDER}`, borderRadius: 12, padding: 20, marginBottom: 16, transition: "border-color 0.3s" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ color: GOLD, fontSize: 13, fontWeight: 700 }}>{p.title}</span>
              {results[i] === true && <span style={{ background: "#1a4a1a", color: "#4cff4c", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✓ CORRECT</span>}
              {results[i] === false && <span style={{ background: "#4a1a1a", color: "#ff4c4c", padding: "3px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>✗ TRY AGAIN</span>}
            </div>
            <div style={{ color: MUTED, fontSize: 12, marginBottom: 10, padding: "6px 10px", background: "#0a0a0a", borderRadius: 6, fontFamily: "monospace" }}>{p.desc}</div>
            <div style={{ color: TEXT, fontSize: 13, marginBottom: 12 }}>{p.question}</div>

            {p.type === "number" ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <input type="number" step="0.01" value={answers[i]}
                  onChange={e => { const na = [...answers]; na[i] = e.target.value; setAnswers(na); }}
                  placeholder="Enter Ω value..."
                  style={{ background: SURFACE2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "8px 14px", fontSize: 14, width: 180, fontFamily: "monospace" }} />
                <button onClick={() => checkAnswer(i)}
                  style={{ background: MAROON, color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  CHECK
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {["Band 1", "Band 2", "Multiplier", "Tolerance"].map((label, bi) => (
                  <div key={bi} style={{ textAlign: "center" }}>
                    <div style={{ color: MUTED, fontSize: 10, marginBottom: 4 }}>{label}</div>
                    <select value={answers[2][bi] || ""}
                      onChange={e => { const na = [...answers]; const bands = [...na[2]]; bands[bi] = e.target.value; na[2] = bands; setAnswers(na); }}
                      style={{ background: SURFACE2, color: TEXT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer" }}>
                      <option value="">Select...</option>
                      {(bi === 3 ? tolBands : dropdownBands).map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                ))}
                <button onClick={() => checkAnswer(i)}
                  style={{ marginTop: 18, background: MAROON, color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontWeight: 700, fontSize: 13 }}>
                  CHECK
                </button>
              </div>
            )}

            {/* Step-by-step breakdown */}
            {results[i] === true && (
              <div style={{ marginTop: 16, padding: 14, background: "#0a1a0a", border: `1px solid #2a4a2a`, borderRadius: 10 }}>
                <div style={{ color: "#4cff4c", fontSize: 11, letterSpacing: 2, marginBottom: 10 }}>STEP-BY-STEP SOLUTION</div>
                {p.formula.map((f, fi) => (
                  <div key={fi} style={{ display: "flex", gap: 12, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ background: MAROON, color: "#fff", borderRadius: 4, padding: "1px 8px", fontSize: 10, fontWeight: 700, whiteSpace: "nowrap", marginTop: 2 }}>{f.step}</span>
                    <span style={{ color: GOLD_LIGHT, fontFamily: "monospace", fontSize: 13 }}>{f.eq}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CREDITS MODAL ────────────────────────────────────────────────────────────
function CreditsModal({ onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000a", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: SURFACE, border: `2px solid ${GOLD}`, borderRadius: 14, padding: 32, maxWidth: 480, width: "90%", boxSizing: "border-box" }} onClick={e => e.stopPropagation()}>
        <div style={{ color: GOLD, fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Credits & Citations</div>
        <div style={{ color: MUTED, fontSize: 12, marginBottom: 20 }}>Advanced Resistance & Resistor Lab</div>
        <div style={{ color: TEXT, fontSize: 13, marginBottom: 16 }}>
          <div style={{ color: GOLD, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>TEAM MEMBERS</div>
          {["Lead Developer", "Physics Consultant", "Curriculum Designer", "UI/UX Specialist"].map(r => (
            <div key={r} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${BORDER}`, padding: "7px 0", fontSize: 13 }}>
              <span style={{ color: MUTED }}>{r}</span>
              <span style={{ color: TEXT }}>— (Add Name)</span>
            </div>
          ))}
        </div>
        <div style={{ color: GOLD, fontSize: 11, letterSpacing: 2, marginBottom: 8 }}>REFERENCES</div>
        {[
          "Serway & Jewett — Physics for Scientists & Engineers, 9th Ed.",
          "Hayt & Kemmerly — Engineering Circuit Analysis, 8th Ed.",
          "NIST — Standard Reference Data for Resistivity Values",
          "IEC 60062 — Resistor Color Code Standard",
        ].map((ref, i) => (
          <div key={i} style={{ color: MUTED, fontSize: 11, marginBottom: 6, paddingLeft: 10, borderLeft: `2px solid ${MAROON}` }}>{ref}</div>
        ))}
        <button onClick={onClose} style={{ marginTop: 20, width: "100%", background: MAROON, color: "#fff", border: "none", borderRadius: 8, padding: "10px 0", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>Close</button>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const [showCredits, setShowCredits] = useState(false);
  const TABS = ["⚡ Wire Simulator", "🎨 Color Code Decoder", "📐 Problem Solving"];

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT, fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ background: SURFACE, borderBottom: `2px solid ${MAROON}`, padding: "10px 20px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ marginRight: 8 }}>
          <div style={{ color: GOLD, fontWeight: 800, fontSize: 16, letterSpacing: 1 }}>⚗ RESISTANCE LAB</div>
          <div style={{ color: MUTED, fontSize: 9, letterSpacing: 2 }}>ADVANCED PHYSICS LABORATORY</div>
        </div>
        <div style={{ display: "flex", gap: 6, flex: 1 }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ background: tab === i ? MAROON : "transparent", color: tab === i ? "#fff" : MUTED, border: `1px solid ${tab === i ? MAROON : BORDER}`, borderRadius: 8, padding: "7px 16px", cursor: "pointer", fontSize: 13, fontWeight: tab === i ? 700 : 400, transition: "all 0.2s" }}>
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCredits(true)}
          style={{ background: "transparent", color: GOLD, border: `1px solid ${GOLD}44`, borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>
          Credits
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 20 }}>
        {tab === 0 && <WireSimulator />}
        {tab === 1 && <ColorCodeDecoder />}
        {tab === 2 && <ProblemSolving />}
      </div>

      {showCredits && <CreditsModal onClose={() => setShowCredits(false)} />}
    </div>
  );
}
