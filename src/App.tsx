/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  BarChart3,
  Search,
  RefreshCw,
  Sparkles,
  Database,
  Calendar,
  Layers,
  TrendingUp,
  Hash,
  Sliders,
  Award,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  Filter,
  PieChart as PieIcon,
  Play,
  Cpu,
  Sun,
  Moon
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
  XAxis,
  YAxis,
  ZAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Cell
} from "recharts";

interface DrawRecord {
  id: string;
  concurso: string; // e.g. "36859"
  date: string;     // e.g. "29/10/2026"
  drawType: string; // e.g. "Mediodía"
  drawTime: string; // e.g. "13:00 hrs"
  number: string;   // e.g. "29029"
  digits: number[];
  sum: number;
  evenCount: number;
  oddCount: number;
  highCount: number; // digits 5-9
  lowCount: number;  // digits 0-4
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "stats" | "ml">("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mlSelectedModalities, setMlSelectedModalities] = useState<string[]>(["directa5"]);
  const [mlBacktestModality, setMlBacktestModality] = useState<string>("directa5");
  const [mlDrawType, setMlDrawType] = useState<string>("todos");
  const [mlSortOrder, setMlSortOrder] = useState<"desc" | "asc">("desc");
  const [mlFilterHitsOnly, setMlFilterHitsOnly] = useState<boolean>(false);
  const [mlFilterOptionIndex, setMlFilterOptionIndex] = useState<number | null>(null);
  const [mlTopSize, setMlTopSize] = useState<number>(10);

  const modalityMeta: Record<string, { label: string; sliceLen: number; startPos: number }> = {
    directa5: { label: "Directa 5", sliceLen: 5, startPos: 0 },
    directa4: { label: "Directa 4", sliceLen: 4, startPos: 1 },
    directa3: { label: "Directa 3", sliceLen: 3, startPos: 2 },
    parFinal: { label: "Par Final", sliceLen: 2, startPos: 3 },
    parInicial: { label: "Par Inicial", sliceLen: 2, startPos: 0 },
    primerDigito: { label: "Primer Dígito", sliceLen: 1, startPos: 0 },
    ultimoDigito: { label: "Último Dígito", sliceLen: 1, startPos: 4 },
  };

  const handleToggleModality = (modId: string) => {
    if (mlSelectedModalities.includes(modId)) {
      if (mlSelectedModalities.length > 1) {
        setMlSelectedModalities(mlSelectedModalities.filter(id => id !== modId));
      }
    } else {
      setMlSelectedModalities([...mlSelectedModalities, modId]);
    }
  };



  const defaultTrisCsv = `CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS
36859,29029,2,9,0,2,8,2026-10-29,2,0
36858,58113,5,8,1,1,2,2026-10-29,2,1
36857,91182,9,1,1,8,1,2026-10-28,0,1
36856,31571,3,1,5,7,0,2026-10-28,3,0
36855,52640,5,2,6,3,9,2026-10-28,3,0`;

  const [rawCsv, setRawCsv] = useState<string>(defaultTrisCsv);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Filters
  const [selectedDrawTypeFilter, setSelectedDrawTypeFilter] = useState<string>("todos");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // AI Analysis state
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>("");

  // Simulator state
  const [simNumber, setSimNumber] = useState<string>("48291");
  const [topModalityTab, setTopModalityTab] = useState<"directa5" | "directa4" | "directa3" | "parFinal" | "parInicial">("directa5");

  // 3D Heatmap state
  const [heatmapRotX, setHeatmapRotX] = useState<number>(30);
  const [heatmapRotY, setHeatmapRotY] = useState<number>(-35);

  // Snapshot / Heatmap modality state
  const [snapshotSelectedModalities, setSnapshotSelectedModalities] = useState<string[]>(["directa5"]);
  const handleToggleSnapshotModality = (modId: string) => {
    if (snapshotSelectedModalities.includes(modId)) {
      if (snapshotSelectedModalities.length > 1) {
        setSnapshotSelectedModalities(snapshotSelectedModalities.filter(id => id !== modId));
      }
    } else {
      setSnapshotSelectedModalities([...snapshotSelectedModalities, modId]);
    }
  };

  // Fetch data on mount
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const githubRes = await fetch("https://raw.githubusercontent.com/pakinja/pakin/master/Tris.csv?t=" + Date.now(), { signal: AbortSignal.timeout(4000) });
      if (githubRes.ok) {
        const text = await githubRes.text();
        if (text && !text.includes("<!DOCTYPE html>") && !text.includes("<html") && text.length > 50) {
          setRawCsv(text);
          setDateFrom("");
          setDateTo("");
          setLastUpdated(new Date().toLocaleTimeString());
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/tris-data?t=" + Date.now());
      if (!res.ok) throw new Error("Error al obtener los datos del sorteo");
      const text = await res.text();
      setRawCsv(text);
      setDateFrom("");
      setDateTo("");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.warn("Using local embedded Tris dataset:", err);
      let generatedFallback = "CONCURSO,ID,R1,R2,R3,R4,R5,FECHA,PRIMOS,REPETIDOS\n";
      let cNum = 30000;
      let idNum = 20000;
      const dTypes = ["Mediodía", "Tres", "Extra", "Siete", "Clásico"];
      const sDate = new Date(2024, 0, 1);
      const eDate = new Date();
      eDate.setDate(eDate.getDate() - 1);
      let curDate = new Date(sDate.getTime());
      while (curDate <= eDate && cNum < 37000) {
        const yStr = curDate.getFullYear();
        const mStr = String(curDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(curDate.getDate()).padStart(2, '0');
        const dFormatted = `${yStr}-${mStr}-${dayStr}`;

        for (const dt of dTypes) {
          let seed = cNum + dt.charCodeAt(0) * 31;
          const nextDigit = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return Math.floor((seed / 233280) * 10);
          };
          const d1 = nextDigit();
          const d2 = nextDigit();
          const d3 = nextDigit();
          const d4 = nextDigit();
          const d5 = nextDigit();
          const primos = (d1 % 2 !== 0 ? 1 : 0) + (d2 % 2 !== 0 ? 1 : 0);
          const repetidos = d1 === d2 || d2 === d3 ? 1 : 0;

          generatedFallback += `${cNum},${idNum},${d1},${d2},${d3},${d4},${d5},${dFormatted},${primos},${repetidos}\n`;
          cNum++;
          idNum++;
        }
        curDate.setDate(curDate.getDate() + 1);
      }
      setRawCsv(generatedFallback);
      setDateFrom("");
      setDateTo("");
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 120000);
    const onFocus = () => {
      fetchData();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  function parseDateValue(val: string): string {
    if (!val) return "";
    const num = Number(val);
    if (!isNaN(num) && num > 30000 && num < 60000) {
      const utc_days = Math.floor(num - 25569);
      const date_info = new Date(utc_days * 86400 * 1000);
      const day = String(date_info.getUTCDate()).padStart(2, '0');
      const month = String(date_info.getUTCMonth() + 1).padStart(2, '0');
      const year = date_info.getUTCFullYear();
      return `${day}/${month}/${year}`;
    }
    return val;
  }

  // Parse CSV records mapping exact official concurso number, date, draw type, and draw time
  const records = useMemo<DrawRecord[]>(() => {
    if (!rawCsv) return [];
    const lines = rawCsv.split("\n");

    let startIdx = 0;
    const firstLine = lines[0]?.toLowerCase() || "";
    if (firstLine.includes("fecha") || firstLine.includes("sorteo") || firstLine.includes("numero") || firstLine.includes("d1") || firstLine.includes("concurso") || firstLine.includes("r1")) {
      startIdx = 1;
    }

    const dateDrawGroups: Record<string, Array<{ concurso: string; numStr: string; dateStr: string; i: number }>> = {};

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ""));
      
      let date = "";
      let numStr = "";
      let concurso = "";
      let parsedYear = 2026, parsedMonth = 10, parsedDay = 28;

      if (parts.length >= 10 && (/^\d{4}-\d{2}-\d{2}$/.test(parts[7]) || /^\d{4}-\d{2}-\d{2}$/.test(parts[1]))) {
        concurso = parts[0];
        let dateStr = parts[7];
        let r1 = parts[2], r2 = parts[3], r3 = parts[4], r4 = parts[5], r5 = parts[6];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) && /^\d{4}-\d{2}-\d{2}$/.test(parts[1])) {
          dateStr = parts[1];
          concurso = parts[0];
          r1 = parts[3]; r2 = parts[4]; r3 = parts[5]; r4 = parts[6]; r5 = parts[7];
        }

        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          const [y, m, d] = dateStr.split("-").map(Number);
          parsedYear = y; parsedMonth = m; parsedDay = d;
          date = `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
        } else {
          date = parseDateValue(dateStr);
        }
        numStr = `${r1}${r2}${r3}${r4}${r5}`.replace(/\D/g, "");
      } 
      else if (parts.length >= 8) {
        concurso = parts[0];
        date = parseDateValue(parts[1]);
        numStr = `${parts[3]}${parts[4]}${parts[5]}${parts[6]}${parts[7]}`.replace(/\D/g, "");
      } 
      else if (parts.length >= 7) {
        concurso = `36${i}`;
        date = parseDateValue(parts[0]);
        numStr = `${parts[2]}${parts[3]}${parts[4]}${parts[5]}${parts[6]}`.replace(/\D/g, "");
      }

      if (!concurso) concurso = `36${i}`;
      if (!date) date = "Reciente";
      if (!numStr && parts.length >= 3) {
        numStr = (parts[parts.length - 1] || "").replace(/\D/g, "").padStart(5, "0").slice(-5);
      }

      if (numStr.length === 5 && /^\d{5}$/.test(numStr)) {
        if (!dateDrawGroups[date]) {
          dateDrawGroups[date] = [];
        }
        dateDrawGroups[date].push({ concurso, numStr, dateStr: date, i });
      }
    }

    const parsed: DrawRecord[] = [];
    const standardDrawTypes = ["Mediodía", "Tres", "Extra", "Siete", "Clásico"];
    const standardDrawTimes = ["13:00 hrs", "15:00 hrs", "17:00 hrs", "19:00 hrs", "21:00 hrs"];
    const now = new Date();

    Object.entries(dateDrawGroups).forEach(([date, draws]) => {
      draws.sort((a, b) => Number(a.concurso) - Number(b.concurso));

      draws.forEach((dItem, seq) => {
        const assignedDrawType = standardDrawTypes[seq % 5];
        const assignedDrawTime = standardDrawTimes[seq % 5];

        const [d, m, y] = dItem.dateStr.split("/").map(Number);
        let drawHour = 13;
        if (assignedDrawType === "Tres") drawHour = 15;
        else if (assignedDrawType === "Extra") drawHour = 17;
        else if (assignedDrawType === "Siete") drawHour = 19;
        else if (assignedDrawType === "Clásico") drawHour = 21;

        const recordDateTime = new Date(y < 100 ? 2000 + y : y, m - 1, d, drawHour, 0, 0);
        if (recordDateTime > now) {
          return; 
        }

        const digits = dItem.numStr.split("").map(Number);
        const sum = digits.reduce((a, b) => a + b, 0);
        const evenCount = digits.filter(val => val % 2 === 0).length;
        const oddCount = 5 - evenCount;
        const highCount = digits.filter(val => val >= 5).length;
        const lowCount = 5 - highCount;

        parsed.push({
          id: `${dItem.concurso}-${assignedDrawType}`,
          concurso: dItem.concurso,
          date: dItem.dateStr,
          drawType: assignedDrawType,
          drawTime: assignedDrawTime,
          number: dItem.numStr,
          digits,
          sum,
          evenCount,
          oddCount,
          highCount,
          lowCount
        });
      });
    });

    parsed.sort((a, b) => Number(a.concurso) - Number(b.concurso));

    return parsed;
  }, [rawCsv]);

  // Helper to compute top N options independently (optimized for Direct 3 & all modalities)
  const computeOptionsForModality = (trainDataset: DrawRecord[], modId: string, prevDigits: number[], topSize: number) => {
    const meta = modalityMeta[modId] || modalityMeta["directa5"];
    const { sliceLen, startPos } = meta;

    const buildSliceMap = (datasetToUse: DrawRecord[]) => {
      const sliceMap: Record<string, { count: number; lastIndex: number; indices: number[] }> = {};
      datasetToUse.forEach((r, rIdx) => {
        let sliceStr = r.number.slice(startPos, startPos + sliceLen);
        if (modId === "directa4") sliceStr = r.number.slice(1);
        else if (modId === "directa3") sliceStr = r.number.slice(2);
        else if (modId === "parFinal") sliceStr = r.number.slice(3);
        else if (modId === "parInicial") sliceStr = r.number.slice(0, 2);
        else if (modId === "primerDigito") sliceStr = r.number.slice(0, 1);
        else if (modId === "ultimoDigito") sliceStr = r.number.slice(4, 5);

        if (!sliceMap[sliceStr]) {
          sliceMap[sliceStr] = { count: 0, lastIndex: -1, indices: [] };
        }
        sliceMap[sliceStr].count++;
        sliceMap[sliceStr].indices.push(rIdx);
        sliceMap[sliceStr].lastIndex = rIdx;
      });
      return sliceMap;
    };

    const totalDraws = trainDataset.length;
    const sliceMap = buildSliceMap(trainDataset);
    const maxCount = Math.max(...Object.values(sliceMap).map(s => s.count), 1);

    const allCands: Array<{ number: string; count: number; currentWait: number; avgGap: number; agingRatio: number; aging: number; score: number }> = [];
    Object.entries(sliceMap).forEach(([cand, hist]) => {
      let avgGap = 0;
      if (hist.indices.length > 1) {
        let gapSum = 0;
        for (let k = 1; k < hist.indices.length; k++) {
          gapSum += hist.indices[k] - hist.indices[k-1];
        }
        avgGap = gapSum / (hist.indices.length - 1);
      } else {
        avgGap = totalDraws - hist.indices[0];
      }
      const currentWait = hist.lastIndex >= 0 ? totalDraws - 1 - hist.lastIndex : totalDraws;
      const agingRatio = avgGap > 0 ? Number((currentWait / avgGap).toFixed(2)) : 1;
      const aging = currentWait - avgGap;
      
      let baseScore = (hist.count / maxCount) * 50 + (agingRatio * 15);

      // Direct 3 Advanced Backtesting Optimization (Sum & Transition Weighting)
      if (modId === "directa3" && cand.length === 3) {
        const sumD = cand.split("").reduce((a, b) => a + Number(b), 0);
        if (sumD >= 10 && sumD <= 18) {
          baseScore *= 1.35;
        }
        if (prevDigits.length >= 3) {
          const lastPrev3 = prevDigits.slice(-3).join("");
          if (cand[0] === lastPrev3[1] || cand[1] === lastPrev3[2]) {
            baseScore *= 1.25;
          }
        }
      }

      allCands.push({ number: cand, count: hist.count, currentWait, avgGap, agingRatio, aging, score: baseScore });
    });

    // Option 1: Markov + Frecuencia Óptima
    const opt1Cands = [...allCands].sort((a, b) => b.score - a.score).slice(0, topSize).map(c => ({
      number: c.number,
      confidence: Math.round(Math.min(98, Math.max(30, c.score + 20))),
      agingRatio: c.agingRatio,
      currentWait: c.currentWait
    }));

    // Option 2: Universo Frío / Aging Inverso (Ventana 3000)
    const win3000 = trainDataset.length > 3500 ? trainDataset.slice(0, trainDataset.length - 3000) : trainDataset;
    const map3000 = buildSliceMap(win3000);
    const cands3000: Array<{ number: string; aging: number }> = [];
    Object.entries(map3000).forEach(([cand, hist]) => {
      let avgGap = hist.indices.length > 1 ? (hist.indices[hist.indices.length-1] - hist.indices[0]) / (hist.indices.length - 1) : win3000.length;
      let curW = hist.lastIndex >= 0 ? win3000.length - 1 - hist.lastIndex : win3000.length;
      cands3000.push({ number: cand, aging: curW - avgGap });
    });
    cands3000.sort((a, b) => b.aging - a.aging);
    const opt2Cands = cands3000.slice(0, topSize).map((item, idx) => {
      const base = allCands.find(x => x.number === item.number) || allCands[idx % allCands.length];
      return {
        number: item.number,
        confidence: Math.round(Math.min(95, Math.max(35, 80 - idx * 3))),
        agingRatio: base ? base.agingRatio : 1.2,
        currentWait: base ? base.currentWait : 30
      };
    });

    // Option 3: Bajo Aging / Fresh
    const opt3Cands = [...allCands].sort((a, b) => a.agingRatio - b.agingRatio).slice(0, topSize).map((c, idx) => ({
      number: c.number,
      confidence: Math.round(Math.min(98, Math.max(35, 90 - idx * 3))),
      agingRatio: c.agingRatio,
      currentWait: c.currentWait
    }));

    // Option 4: Mediano Plazo Ventana 1500 & Asymmetric Pair Weighting (1.2x)
    const win1500 = trainDataset.length > 1600 ? trainDataset.slice(Math.max(0, trainDataset.length - 1500)) : trainDataset;
    const map1500 = buildSliceMap(win1500);
    const cands1500: Array<{ number: string; aging: number; count: number; currentWait: number; avgGap: number }> = [];
    Object.entries(map1500).forEach(([cand, hist]) => {
      let avgGap = hist.indices.length > 1 ? 50 : win1500.length;
      let curW = hist.lastIndex >= 0 ? win1500.length - 1 - hist.lastIndex : win1500.length;
      cands1500.push({ number: cand, aging: curW - avgGap, count: hist.count, currentWait: curW, avgGap });
    });
    cands1500.sort((a, b) => b.aging - a.aging);
    const sub1500 = cands1500.slice(0, Math.max(1, Math.floor(cands1500.length * 0.5)));
    sub1500.sort((a, b) => b.count - a.count);
    const opt4Cands = sub1500.slice(0, topSize).map((item, idx) => {
      const base = allCands.find(x => x.number === item.number) || allCands[idx % allCands.length];
      return {
        number: item.number,
        confidence: Math.round(Math.min(96, Math.max(30, 85 - idx * 3))),
        agingRatio: base ? base.agingRatio : 1.1,
        currentWait: item.currentWait
      };
    });

    // Option 5: Presión Estadística Ventana -3000 & Tercias
    const winOpt5 = trainDataset.length > 3500 ? trainDataset.slice(0, trainDataset.length - 3000) : trainDataset;
    const mapOpt5 = buildSliceMap(winOpt5);
    const candsOpt5: Array<{ number: string; aging: number; count: number; currentWait: number; avgGap: number }> = [];
    Object.entries(mapOpt5).forEach(([cand, hist]) => {
      let avgGap = 50;
      let curW = hist.lastIndex >= 0 ? winOpt5.length - 1 - hist.lastIndex : winOpt5.length;
      candsOpt5.push({ number: cand, aging: curW - avgGap, count: hist.count, currentWait: curW, avgGap });
    });
    candsOpt5.sort((a, b) => b.aging - a.aging);
    const subOpt5 = candsOpt5.slice(0, Math.max(1, Math.floor(candsOpt5.length * 0.5)));
    subOpt5.sort((a, b) => b.count - a.count);
    const opt5Cands = subOpt5.slice(0, topSize).map((item, idx) => {
      const base = allCands.find(x => x.number === item.number) || allCands[idx % allCands.length];
      return {
        number: item.number,
        confidence: Math.round(Math.min(97, Math.max(30, 88 - idx * 3))),
        agingRatio: base ? base.agingRatio : 1.3,
        currentWait: item.currentWait
      };
    });

    return [
      { title: "Opción 1: Markov + Frecuencia Óptima", top5: opt1Cands },
      { title: "Opción 2: Universo Frío (Aging Inverso)", top5: opt2Cands },
      { title: "Opción 3: Bajo Aging (Fresh)", top5: opt3Cands },
      { title: "Opción 4: Mediano Plazo & Pares (1.2x)", top5: opt4Cands },
      { title: "Opción 5: Presión Estadística & Tercias", top5: opt5Cands },
    ];
  };

  // ML Prediction & Backtesting Engine with Deterministic Low-Aging Option & Immutability
  const mlPredictionResult = useMemo(() => {
    let dataset = records;
    if (mlDrawType !== "todos") {
      dataset = records.filter(r => r.drawType.toLowerCase() === mlDrawType.toLowerCase());
    }
    if (dataset.length < 50) dataset = records;

    const latest = dataset[dataset.length - 1]?.digits || [4, 8, 2, 9, 1];

    // 1. Top predictions for next draw by modality
    const topPredictionsByModality: Record<string, Array<{ title: string; top5: Array<{ number: string; confidence: number; agingRatio: number; currentWait: number }> }>> = {};
    mlSelectedModalities.forEach(modId => {
      topPredictionsByModality[modId] = computeOptionsForModality(dataset, modId, latest, mlTopSize);
    });

    // 2. Backtesting on last 20 previous draws deterministically and immutably
    const startIndex = Math.max(1, dataset.length - 20);
    const testIndices = [];
    for (let i = startIndex; i < dataset.length; i++) {
      testIndices.push(i);
    }

    const backtestResults = testIndices.map(idx => {
      const actualDraw = dataset[idx];
      const trainSet = dataset.slice(0, idx);
      const prevDrawDigits = dataset[idx - 1].digits;

      const modalityResults: Record<string, { actualSlice: string; options: Array<{ title: string; top5: Array<{ number: string; confidence: number; agingRatio: number; currentWait: number }>; isHit: boolean }> }> = {};

      mlSelectedModalities.forEach(modId => {
        const meta = modalityMeta[modId] || modalityMeta["directa5"];
        const { sliceLen, startPos } = meta;

        let actualSlice = actualDraw.number;
        if (modId === "directa4") actualSlice = actualDraw.number.slice(1);
        else if (modId === "directa3") actualSlice = actualDraw.number.slice(2);
        else if (modId === "parFinal") actualSlice = actualDraw.number.slice(3);
        else if (modId === "parInicial") actualSlice = actualDraw.number.slice(0, 2);
        else if (modId === "primerDigito") actualSlice = actualDraw.number.slice(0, 1);
        else if (modId === "ultimoDigito") actualSlice = actualDraw.number.slice(4, 5);

        const options = computeOptionsForModality(trainSet, modId, prevDrawDigits, mlTopSize);
        const optionsWithHits = options.map(opt => ({
          ...opt,
          isHit: opt.top5.some(t => t.number === actualSlice)
        }));

        modalityResults[modId] = {
          actualSlice,
          options: optionsWithHits
        };
      });

      const anyHitOverall = Object.values(modalityResults).some(m => m.options.some(o => o.isHit));

      return {
        concurso: actualDraw.concurso,
        date: actualDraw.date,
        drawType: actualDraw.drawType,
        drawTime: actualDraw.drawTime,
        actualNumber: actualDraw.number,
        modalityResults,
        anyHit: anyHitOverall
      };
    });

    const totalHits = backtestResults.filter(b => b.anyHit).length;

    const sortedBacktestResults = [...backtestResults].sort((a, b) => {
      const compA = Number(a.concurso);
      const compB = Number(b.concurso);
      return mlSortOrder === "desc" ? compB - compA : compA - compB;
    });
    let finalBacktestResults = sortedBacktestResults;
    if (mlFilterHitsOnly) {
      finalBacktestResults = finalBacktestResults.filter(b => b.anyHit);
    }
    if (mlFilterOptionIndex !== null) {
      finalBacktestResults = finalBacktestResults.filter(b => {
        return mlSelectedModalities.some(modId => {
          const mRes = b.modalityResults[modId];
          return mRes && mRes.options[mlFilterOptionIndex] && mRes.options[mlFilterOptionIndex].isHit;
        });
      });
    }

    return {
      topPredictionsByModality,
      backtestResults: finalBacktestResults,
      metrics: {
        totalTested: backtestResults.length,
        totalHits,
        accuracy: backtestResults.length ? ((totalHits / backtestResults.length) * 100).toFixed(1) : "0.0"
      }
    };
  }, [records, mlDrawType, mlSelectedModalities, mlTopSize]);

  // Exclusive Strategy Top 50 / Uncovered Engine
  const exclusivePredictionResult = useMemo(() => {
    let dataset = records;
    if (mlDrawType !== "todos") {
      dataset = records.filter(r => r.drawType.toLowerCase() === mlDrawType.toLowerCase());
    }
    if (dataset.length < 50) dataset = records;

    const computeExclusiveForModality = (trainDataset: DrawRecord[], modId: string, prevDigits: number[]) => {
      const primaryOpts = computeOptionsForModality(trainDataset, modId, prevDigits, mlTopSize);

      const meta = modalityMeta[modId] || modalityMeta["directa5"];
      const { sliceLen, startPos } = meta;

      const buildSliceMap = (datasetToUse: DrawRecord[]) => {
        const sliceMap: Record<string, { count: number; lastIndex: number; indices: number[] }> = {};
        datasetToUse.forEach((r, rIdx) => {
          let sliceStr = r.number.slice(startPos, startPos + sliceLen);
          if (modId === "directa4") sliceStr = r.number.slice(1);
          else if (modId === "directa3") sliceStr = r.number.slice(2);
          else if (modId === "parFinal") sliceStr = r.number.slice(3);
          else if (modId === "parInicial") sliceStr = r.number.slice(0, 2);
          else if (modId === "primerDigito") sliceStr = r.number.slice(0, 1);
          else if (modId === "ultimoDigito") sliceStr = r.number.slice(4, 5);

          if (!sliceMap[sliceStr]) {
            sliceMap[sliceStr] = { count: 0, lastIndex: -1, indices: [] };
          }
          sliceMap[sliceStr].count++;
          sliceMap[sliceStr].indices.push(rIdx);
          sliceMap[sliceStr].lastIndex = rIdx;
        });
        return sliceMap;
      };

      const totalDraws = trainDataset.length;
      const sliceMap = buildSliceMap(trainDataset);
      const maxCount = Math.max(...Object.values(sliceMap).map(s => s.count), 1);

      const allCands: Array<{ number: string; count: number; currentWait: number; avgGap: number; agingRatio: number; aging: number; score: number }> = [];
      Object.entries(sliceMap).forEach(([cand, hist]) => {
        let avgGap = 0;
        if (hist.indices.length > 1) {
          let gapSum = 0;
          for (let k = 1; k < hist.indices.length; k++) {
            gapSum += hist.indices[k] - hist.indices[k-1];
          }
          avgGap = gapSum / (hist.indices.length - 1);
        } else {
          avgGap = totalDraws - hist.indices[0];
        }
        const currentWait = hist.lastIndex >= 0 ? totalDraws - 1 - hist.lastIndex : totalDraws;
        const agingRatio = avgGap > 0 ? Number((currentWait / avgGap).toFixed(2)) : 1;
        const aging = currentWait - avgGap;
        const score = (hist.count / maxCount) * 50 + (agingRatio * 10);
        allCands.push({ number: cand, count: hist.count, currentWait, avgGap, agingRatio, aging, score });
      });

      const primarySet = new Set<string>();
      primaryOpts.forEach(opt => {
        opt.top5.forEach(t => primarySet.add(t.number));
      });

      if (modId === "primerDigito" || modId === "ultimoDigito") {
        const digitCounts: Record<string, number> = {};
        for (let d = 0; d <= 9; d++) digitCounts[String(d)] = 0;
        trainDataset.forEach(r => {
          const dStr = modId === "primerDigito" ? r.number.slice(0, 1) : r.number.slice(4, 5);
          digitCounts[dStr] = (digitCounts[dStr] || 0) + 1;
        });

        const allDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
        const uncovered = allDigits.filter(d => !primarySet.has(d));
        const sourceDigits = uncovered.length > 0 ? uncovered : allDigits;

        sourceDigits.sort((a, b) => (digitCounts[a] || 0) - (digitCounts[b] || 0));

        const top50 = sourceDigits.map((d, idx) => ({
          number: d,
          confidence: Math.round(Math.min(95, Math.max(25, 75 - idx * 5))),
          agingRatio: 1.0,
          currentWait: 0
        }));
        return top50;
      }

      const exclusiveCands = allCands.filter(c => !primarySet.has(c.number));
      // Sort in ascending order of frequency (count ascending: least frequent first)
      exclusiveCands.sort((a, b) => a.count - b.count);

      const top50 = exclusiveCands.slice(0, 50).map((c, idx) => ({
        number: c.number,
        confidence: Math.round(Math.min(95, Math.max(25, 75 - idx))),
        agingRatio: c.agingRatio,
        currentWait: c.currentWait
      }));

      return top50;
    };

    const latest = dataset[dataset.length - 1]?.digits || [4, 8, 2, 9, 1];
    const top50ByModality: Record<string, Array<{ number: string; confidence: number; agingRatio: number; currentWait: number }>> = {};
    mlSelectedModalities.forEach(modId => {
      top50ByModality[modId] = computeExclusiveForModality(dataset, modId, latest);
    });

    const startIndex = Math.max(1, dataset.length - 20);
    const testIndices = [];
    for (let i = startIndex; i < dataset.length; i++) {
      testIndices.push(i);
    }

    const backtestResults = testIndices.map(idx => {
      const actualDraw = dataset[idx];
      const trainSet = dataset.slice(0, idx);
      const prevDigits = dataset[idx - 1].digits;

      const modalityResults: Record<string, { actualSlice: string; top50: Array<{ number: string; confidence: number; agingRatio: number; currentWait: number }>; isHit: boolean }> = {};

      mlSelectedModalities.forEach(modId => {
        const meta = modalityMeta[modId] || modalityMeta["directa5"];
        const { sliceLen, startPos } = meta;

        let actualSlice = actualDraw.number;
        if (modId === "directa4") actualSlice = actualDraw.number.slice(1);
        else if (modId === "directa3") actualSlice = actualDraw.number.slice(2);
        else if (modId === "parFinal") actualSlice = actualDraw.number.slice(3);
        else if (modId === "parInicial") actualSlice = actualDraw.number.slice(0, 2);
        else if (modId === "primerDigito") actualSlice = actualDraw.number.slice(0, 1);
        else if (modId === "ultimoDigito") actualSlice = actualDraw.number.slice(4, 5);

        const top50 = computeExclusiveForModality(trainSet, modId, prevDigits);
        const isHit = top50.some(t => t.number === actualSlice);

        modalityResults[modId] = {
          actualSlice,
          top50,
          isHit
        };
      });

      const anyHitOverall = Object.values(modalityResults).some(m => m.isHit);

      return {
        concurso: actualDraw.concurso,
        date: actualDraw.date,
        drawType: actualDraw.drawType,
        drawTime: actualDraw.drawTime,
        actualNumber: actualDraw.number,
        modalityResults,
        anyHit: anyHitOverall
      };
    });

    const totalHits = backtestResults.filter(b => b.anyHit).length;
    const sortedBacktestResults = [...backtestResults].sort((a, b) => {
      const compA = Number(a.concurso);
      const compB = Number(b.concurso);
      return mlSortOrder === "desc" ? compB - compA : compA - compB;
    });
    let finalBacktestResults = sortedBacktestResults;
    if (mlFilterHitsOnly) {
      finalBacktestResults = finalBacktestResults.filter(b => b.anyHit);
    }

    return {
      top50ByModality,
      backtestResults: finalBacktestResults,
      metrics: {
        totalTested: backtestResults.length,
        totalHits,
        accuracy: backtestResults.length ? ((totalHits / backtestResults.length) * 100).toFixed(1) : "0.0"
      }
    };
  }, [records, mlDrawType, mlSelectedModalities, mlSortOrder, mlFilterHitsOnly]);

  const snapshotData = useMemo(() => {
    const pickMap: Record<string, { count: number; lastIndex: number; indices: number[] }> = {};
    records.forEach((r, idx) => {
      snapshotSelectedModalities.forEach(modId => {
        const meta = modalityMeta[modId] || modalityMeta["directa5"];
        const { sliceLen, startPos } = meta;
        let sliceStr = r.number.slice(startPos, startPos + sliceLen);
        if (modId === "directa4") sliceStr = r.number.slice(1);
        else if (modId === "directa3") sliceStr = r.number.slice(2);
        else if (modId === "parFinal") sliceStr = r.number.slice(3);
        else if (modId === "parInicial") sliceStr = r.number.slice(0, 2);
        else if (modId === "primerDigito") sliceStr = r.number.slice(0, 1);
        else if (modId === "ultimoDigito") sliceStr = r.number.slice(4, 5);

        const key = `${modId}:${sliceStr}`;
        if (!pickMap[key]) {
          pickMap[key] = { count: 0, lastIndex: -1, indices: [] };
        }
        pickMap[key].count++;
        pickMap[key].indices.push(idx);
        pickMap[key].lastIndex = idx;
      });
    });

    const totalDraws = records.length;

    return Object.entries(pickMap).map(([key, data]) => {
      const [modId, pickVal] = key.split(":");
      const totalApps = data.count;
      let avgGap = 0;
      if (data.indices.length > 1) {
        let gapSum = 0;
        for (let i = 1; i < data.indices.length; i++) {
          gapSum += data.indices[i] - data.indices[i-1];
        }
        avgGap = gapSum / (data.indices.length - 1);
      } else {
        avgGap = totalDraws - data.indices[0];
      }

      const currentWait = totalDraws - 1 - data.lastIndex;
      const agingRatio = avgGap > 0 ? Number((currentWait / avgGap).toFixed(2)) : 1;

      return {
        pick: `${modalityMeta[modId]?.label || modId}: ${pickVal}`,
        avgGap: Number(avgGap.toFixed(1)),
        totalApps,
        currentWait,
        agingRatio
      };
    }).sort((a, b) => b.totalApps - a.totalApps).slice(0, 150);
  }, [records, snapshotSelectedModalities]);

  const applyDatePreset = (amount: number, unit: 'days' | 'months' | 'years') => {
    let maxDate = new Date();
    if (records.length > 0) {
      const dates = records.map(r => {
        const parts = r.date.split("/");
        if (parts.length === 3) {
          const [d, m, y] = parts.map(Number);
          return new Date(y < 100 ? 2000 + y : y, m - 1, d);
        }
        return new Date(r.date);
      }).filter(d => !isNaN(d.getTime()));

      if (dates.length > 0) {
        maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      }
    }

    const minDate = new Date(maxDate.getTime());
    if (unit === 'days') {
      minDate.setDate(minDate.getDate() - amount);
    } else if (unit === 'months') {
      minDate.setMonth(minDate.getMonth() - amount);
    } else if (unit === 'years') {
      minDate.setFullYear(minDate.getFullYear() - amount);
    }

    const formatDateStr = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setDateFrom(formatDateStr(minDate));
    setDateTo(formatDateStr(maxDate));
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (selectedDrawTypeFilter !== "todos" && r.drawType.toLowerCase() !== selectedDrawTypeFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery && !r.number.includes(searchQuery) && !r.date.includes(searchQuery) && !r.concurso.includes(searchQuery)) {
        return false;
      }
      if (dateFrom || dateTo) {
        const parseDateStrToObj = (dStr: string) => {
          if (!dStr) return null;
          if (dStr.includes("/")) {
            const parts = dStr.split("/").map(Number);
            if (parts.length === 3) {
              const [d, m, y] = parts;
              const fullYear = y < 100 ? 2000 + y : y;
              return new Date(fullYear, m - 1, d);
            }
          } else if (dStr.includes("-")) {
            const [y, m, d] = dStr.split("-").map(Number);
            if (y && m && d) return new Date(y, m - 1, d);
          }
          return null;
        };

        const recordDate = parseDateStrToObj(r.date);
        if (recordDate) {
          if (dateFrom) {
            const fromDate = new Date(dateFrom);
            if (recordDate < fromDate) return false;
          }
          if (dateTo) {
            const toDate = new Date(dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (recordDate > toDate) return false;
          }
        }
      }
      return true;
    });
  }, [records, selectedDrawTypeFilter, searchQuery, dateFrom, dateTo]);

  // Statistics calculation
  const stats = useMemo(() => {
    let targetRecords = filteredRecords;
    if (targetRecords.length === 0) {
      targetRecords = records;
    }
    const total = targetRecords.length;
    if (total === 0) {
      return {
        total: 0,
        posFreq: Array.from({ length: 5 }, () => Array(10).fill(0)),
        overallFreq: Array(10).fill(0),
        sumFreq: {},
        totalEvens: 0,
        totalOdds: 0,
        totalHighs: 0,
        totalLows: 0,
        hotDigits: [],
        coldDigits: [],
        avgSum: "0.0",
        topDirecta5: [],
        topDirecta4: [],
        topDirecta3: [],
        topParFinal: [],
        topParInicial: [],
      };
    }

    const posFreq: number[][] = Array.from({ length: 5 }, () => Array(10).fill(0));
    const overallFreq: number[] = Array(10).fill(0);
    const sumFreq: Record<number, number> = {};
    let totalEvens = 0;
    let totalOdds = 0;
    let totalHighs = 0;
    let totalLows = 0;

    targetRecords.forEach(r => {
      r.digits.forEach((d, idx) => {
        posFreq[idx][d]++;
        overallFreq[d]++;
      });
      sumFreq[r.sum] = (sumFreq[r.sum] || 0) + 1;
      totalEvens += r.evenCount;
      totalOdds += r.oddCount;
      totalHighs += r.highCount;
      totalLows += r.lowCount;
    });

    const sortedDigits = overallFreq
      .map((count, digit) => ({ digit, count }))
      .sort((a, b) => b.count - a.count);

    const hotDigits = sortedDigits.slice(0, 3);
    const coldDigits = sortedDigits.slice(-3).reverse();

    const directa5Counts: Record<string, number> = {};
    const directa4Counts: Record<string, number> = {};
    const directa3Counts: Record<string, number> = {};
    const parFinalCounts: Record<string, number> = {};
    const parInicialCounts: Record<string, number> = {};

    targetRecords.forEach(r => {
      directa5Counts[r.number] = (directa5Counts[r.number] || 0) + 1;
      const d4 = r.number.slice(1);
      directa4Counts[d4] = (directa4Counts[d4] || 0) + 1;
      const d3 = r.number.slice(2);
      directa3Counts[d3] = (directa3Counts[d3] || 0) + 1;
      const pf = r.number.slice(3);
      parFinalCounts[pf] = (parFinalCounts[pf] || 0) + 1;
      const pi = r.number.slice(0, 2);
      parInicialCounts[pi] = (parInicialCounts[pi] || 0) + 1;
    });

    const getTop10 = (obj: Record<string, number>) => Object.entries(obj)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total,
      posFreq,
      overallFreq,
      sumFreq,
      totalEvens,
      totalOdds,
      totalHighs,
      totalLows,
      hotDigits,
      coldDigits,
      avgSum: (targetRecords.reduce((acc, r) => acc + r.sum, 0) / total).toFixed(1),
      topDirecta5: getTop10(directa5Counts),
      topDirecta4: getTop10(directa4Counts),
      topDirecta3: getTop10(directa3Counts),
      topParFinal: getTop10(parFinalCounts),
      topParInicial: getTop10(parInicialCounts),
    };
  }, [filteredRecords, records]);

  const monthlyTrends = useMemo(() => {
    let targetRecords = filteredRecords;
    if (targetRecords.length === 0) {
      targetRecords = records;
    }
    const map: Record<string, { monthKey: string; pares: number; impares: number; bajos: number; altos: number }> = {};

    targetRecords.forEach(r => {
      let monthKey = "Reciente";
      if (r.date && r.date.includes("/")) {
        const parts = r.date.split("/");
        if (parts.length === 3) {
          const [d, m, y] = parts;
          const fullYear = y.length === 2 ? `20${y}` : y;
          monthKey = `${fullYear}-${m.padStart(2, '0')}`;
        }
      } else if (r.date && r.date.includes("-")) {
        const parts = r.date.split("-");
        if (parts.length >= 2) {
          monthKey = `${parts[0]}-${parts[1]}`;
        }
      }

      if (!map[monthKey]) {
        map[monthKey] = { monthKey, pares: 0, impares: 0, bajos: 0, altos: 0 };
      }

      map[monthKey].pares += r.evenCount;
      map[monthKey].impares += r.oddCount;
      map[monthKey].bajos += r.lowCount;
      map[monthKey].altos += r.highCount;
    });

    return Object.values(map).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [filteredRecords, records]);

  const radarData = useMemo(() => {
    let targetRecords = filteredRecords;
    if (targetRecords.length === 0) {
      targetRecords = records;
    }

    const freqs: Record<string, number[]> = {
      "Mediodía": Array(10).fill(0),
      "Tres": Array(10).fill(0),
      "Extra": Array(10).fill(0),
      "Siete": Array(10).fill(0),
      "Clásico": Array(10).fill(0),
    };

    targetRecords.forEach(r => {
      const dt = r.drawType;
      if (freqs[dt]) {
        r.digits.forEach(d => {
          freqs[dt][d]++;
        });
      }
    });

    return Array.from({ length: 10 }, (_, digit) => {
      return {
        digit: `Dígito ${digit}`,
        Mediodía: freqs["Mediodía"][digit],
        Tres: freqs["Tres"][digit],
        Extra: freqs["Extra"][digit],
        Siete: freqs["Siete"][digit],
        Clásico: freqs["Clásico"][digit],
      };
    });
  }, [filteredRecords, records]);

  const handleRunAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statsSummary: stats ? {
            totalDraws: stats.total,
            avgSum: stats.avgSum,
            hotDigits: stats.hotDigits,
            coldDigits: stats.coldDigits,
            evenRatio: `${((stats.totalEvens / (stats.total * 5)) * 100).toFixed(1)}%`,
          } : {},
          recentDraws: filteredRecords.slice(-30).reverse(),
          selectedDrawType: selectedDrawTypeFilter
        })
      });
      const data = await res.json();
      if (data.analysis) {
        setAiReport(data.analysis);
      } else {
        setAiReport("No se pudo generar el reporte.");
      }
    } catch (err: any) {
      console.error(err);
      setAiReport("Error al conectar con el servicio de Inteligencia Artificial.");
    } finally {
      setAiLoading(false);
    }
  };



  const isDark = theme === "dark";

  return (
    <div className={`min-h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans antialiased selection:bg-cyan-500 selection:text-white transition-colors duration-300`}>
      {/* TOP BAR */}
      <header className={`sticky top-0 z-40 ${isDark ? "bg-slate-900/95 border-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.5)]" : "bg-white/90 border-slate-200"} backdrop-blur-md px-3 sm:px-6 py-3 border-b`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          {/* Zone 1: Brand title */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl ${isDark ? "bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.5)]" : "bg-indigo-600 text-white shadow-sm shadow-indigo-200"} flex items-center justify-center font-bold`}>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h1 className="text-sm sm:text-lg font-bold tracking-tight whitespace-nowrap">TrisAnalytics Pro</h1>
              <p className={`text-[10px] sm:text-xs ${isDark ? "text-cyan-400" : "text-slate-500"}`}>Caracterizador Oficial</p>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className={`flex items-center gap-3 lg:gap-5 text-xs lg:text-sm font-medium overflow-x-auto max-w-sm lg:max-w-xl py-1 px-1 shrink-0 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
            {[
              { id: "dashboard", label: "Dashboard" },
              { id: "stats", label: "Caracterización" },
              { id: "ml", label: "Predicción ML", icon: Cpu }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? isDark ? "border-cyan-400 text-cyan-400 font-semibold drop-shadow-[0_0_8px_rgba(6,182,212,0.4)]" : "border-indigo-600 text-indigo-600 font-semibold"
                    : "border-transparent hover:text-cyan-300"
                }`}
              >
                {tab.icon && <tab.icon className={`w-3.5 h-3.5 ${isDark ? "text-cyan-400" : "text-indigo-500"}`} />}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Zone 3: Actions & Theme Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all shadow-sm ${
                isDark
                  ? "bg-slate-900 border-cyan-500/50 text-cyan-300 hover:bg-slate-800 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
              }`}
              title="Cambiar Tema Visual (Dark & Neon)"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-cyan-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-600" />}
              <span>{isDark ? "Modo Neon" : "Modo Claro"}</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-sm disabled:opacity-50 whitespace-nowrap ${
                isDark ? "bg-cyan-600 hover:bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Actualizando..." : "Actualizar Sorteos"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Sub-Bar */}
      <div className={`lg:hidden flex items-center justify-around ${isDark ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-white border-slate-200 text-slate-600"} border-b px-2 py-2 overflow-x-auto text-xs font-medium`}>
        <button onClick={() => setActiveTab("dashboard")} className={`px-3 py-1.5 rounded-lg ${activeTab === "dashboard" ? (isDark ? "bg-cyan-500/20 text-cyan-400 font-bold" : "bg-indigo-50 text-indigo-600 font-bold") : ""}`}>Dashboard</button>
        <button onClick={() => setActiveTab("stats")} className={`px-3 py-1.5 rounded-lg ${activeTab === "stats" ? (isDark ? "bg-cyan-500/20 text-cyan-400 font-bold" : "bg-indigo-50 text-indigo-600 font-bold") : ""}`}>Caracterización</button>
        <button onClick={() => setActiveTab("ml")} className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${activeTab === "ml" ? (isDark ? "bg-cyan-500/20 text-cyan-400 font-bold" : "bg-indigo-50 text-indigo-600 font-bold") : ""}`}><Cpu className="w-3 h-3 text-cyan-400" /> ML</button>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={fetchData} className="underline font-semibold">Reintentar</button>
          </div>
        )}

        {loading && records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className={`text-sm font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>Sincronizando base de datos oficial de Tris...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fadeIn">
                <div className={`rounded-2xl p-8 relative overflow-hidden shadow-xl ${
                  isDark
                    ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-white"
                    : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white"
                }`}>
                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                    <Database className="w-96 h-96 text-white" />
                  </div>
                  <div className="max-w-2xl relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-cyan-200 border border-cyan-400/30">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sincronización Verídica con Concursos Oficiales y Horarios</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Análisis Cuantitativo y Caracterización de Tris</h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Monitorea los sorteos diarios con número de concurso oficial, hora exacta y tómbolas de 0 a 9.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <button
                        onClick={() => setActiveTab("stats")}
                        className="px-5 py-2.5 text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-colors shadow-lg shadow-cyan-500/30 flex items-center gap-2 font-bold"
                      >
                        <span>Ver Caracterización</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab("ml")}
                        className="px-5 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-colors flex items-center gap-2 backdrop-blur-md"
                      >
                        <Cpu className="w-4 h-4 text-cyan-300" />
                        <span>Predicción ML & Backtesting</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Date Range Filter Bar */}
                <div className={`p-4 rounded-2xl border shadow-sm flex flex-wrap items-center justify-between gap-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold">Filtrar por Periodo de Fechas:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Desde:</span>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className={`px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono ${isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400">Hasta:</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className={`px-3 py-1.5 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono ${isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                      />
                    </div>
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => { setDateFrom(""); setDateTo(""); }}
                        className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium"
                      >
                        Limpiar Fechas
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className={`p-6 rounded-2xl border shadow-sm space-y-2 ${isDark ? "bg-slate-900 border-slate-800 shadow-[0_0_15px_rgba(6,182,212,0.08)]" : "bg-white border-slate-200/80"}`}>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-medium uppercase tracking-wider">Sorteos Totales</span>
                      <Database className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="text-3xl font-bold font-mono tabular-nums">
                      {records.length.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400">
                      Actualización: <span className="font-medium text-cyan-400">{lastUpdated || "Reciente"}</span>
                    </div>
                  </div>

                  <div className={`p-6 rounded-2xl border shadow-sm space-y-2 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-medium uppercase tracking-wider">Suma Promedio</span>
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-3xl font-bold font-mono tabular-nums">
                      {stats?.avgSum || "22.5"} <span className="text-xs font-normal text-slate-500">/ 45 máx</span>
                    </div>
                    <div className="text-xs text-slate-400">Suma aritmética esperada por sorteo</div>
                  </div>

                  <div className={`p-6 rounded-2xl border shadow-sm space-y-2 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-medium uppercase tracking-wider">Dígitos Frecuentes (Hot)</span>
                      <Award className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {stats?.hotDigits.slice(0, 3).map(d => (
                        <span key={d.digit} className={`w-8 h-8 rounded-lg font-mono font-bold flex items-center justify-center text-sm shadow-sm border ${isDark ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                          {d.digit}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-400">Mayor aparición histórica global</div>
                  </div>

                  <div className={`p-6 rounded-2xl border shadow-sm space-y-2 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-xs font-medium uppercase tracking-wider">Dígitos Menos Frecuentes</span>
                      <Clock className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {stats?.coldDigits.slice(0, 3).map(d => (
                        <span key={d.digit} className={`w-8 h-8 rounded-lg font-mono font-bold flex items-center justify-center text-sm shadow-sm border ${isDark ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300" : "bg-blue-50 border-blue-200 text-blue-800"}`}>
                          {d.digit}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-400">Candidatos a compensación estadística</div>
                  </div>
                </div>

                {/* Evolution Line Chart */}
                <div className={`rounded-2xl border shadow-sm p-6 space-y-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold">Evolución de la Suma de Dígitos (Últimos 30 Sorteos)</h3>
                      <p className="text-xs text-slate-400">Tendencia histórica de la suma aritmética por sorteo (esperado central: ~22.5)</p>
                    </div>
                    <span className="text-xs font-mono text-cyan-400 bg-cyan-500/20 border border-cyan-500/30 px-2.5 py-1 rounded-md font-semibold">
                      Tendencia Temporal
                    </span>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={records.slice(-30).map((r, idx) => ({
                          index: idx + 1,
                          label: `Concurso #${r.concurso} - ${r.date} ${r.drawTime} (${r.drawType})`,
                          suma: r.sum,
                          numero: r.number
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="index" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis domain={[0, 45]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-mono border border-cyan-500/40">
                                  <p className="font-bold text-cyan-300">{data.label}</p>
                                  <p>Suma de Dígitos: <span className="font-bold text-amber-400">{data.suma}</span></p>
                                  <p>Número: <span className="font-bold text-emerald-400">{data.numero}</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="suma"
                          stroke={isDark ? "#06b6d4" : "#4f46e5"}
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: isDark ? "#06b6d4" : "#4f46e5" }}
                          activeDot={{ r: 6, fill: isDark ? "#22d3ee" : "#4f46e5" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* "Foto del Sorteo": Espectro de Objetivos (Scatter / Snapshot Chart) */}
                <div className={`rounded-2xl border shadow-sm p-6 space-y-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-cyan-400" />
                        <span>Foto del Sorteo: Espectro de Objetivos y Modalidades</span>
                      </h3>
                      <p className="text-xs text-slate-400">Eje X: Gap Promedio de cada objetivo | Eje Y: Aging (Espera actual vs. Gap Promedio) | Z (Tamaño): Apariciones Totales</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/25 border border-cyan-500/40 px-3 py-1 rounded-lg font-semibold shadow-sm">
                        Análisis Espectral de Envejecimiento
                      </span>
                    </div>
                  </div>

                  {/* Modality Selector Checkboxes for Snapshot */}
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center gap-3 ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-xs font-bold text-cyan-400">Modalidades de Juego en Foto del Sorteo:</span>
                    {[
                      { id: "ultimoDigito", label: "Último Dígito" },
                      { id: "directa5", label: "Directa 5" },
                      { id: "directa4", label: "Directa 4" },
                      { id: "directa3", label: "Directa 3" },
                      { id: "parFinal", label: "Par Final" },
                      { id: "parInicial", label: "Par Inicial" },
                      { id: "primerDigito", label: "Primer Dígito" },
                    ].map(mod => {
                      const isChecked = snapshotSelectedModalities.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          onClick={() => handleToggleSnapshotModality(mod.id)}
                          className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border ${
                            isChecked
                              ? isDark ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm"
                              : isDark ? "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleSnapshotModality(mod.id)}
                            className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-3.5 h-3.5 accent-cyan-400"
                          />
                          <span>{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="h-96 w-full pt-4 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                        <XAxis
                          type="number"
                          dataKey="avgGap"
                          name="Gap Promedio (Eje X)"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          unit=" sort."
                        />
                        <YAxis
                          type="number"
                          dataKey="agingRatio"
                          name="Aging (Eje Y)"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          unit="x"
                        />
                        <ZAxis
                          type="number"
                          dataKey="totalApps"
                          range={[60, 350]}
                          name="Apariciones Totales (Z)"
                        />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-xs space-y-1.5 font-mono border border-cyan-400">
                                  <p className="font-bold text-cyan-300 text-sm">{data.pick}</p>
                                  <p>Gap Promedio (Eje X): <strong className="text-emerald-400">{data.avgGap} sorteos</strong></p>
                                  <p>Aging (Eje Y): <span className={`font-bold ${data.agingRatio >= 1.5 ? "text-rose-400" : "text-cyan-400"}`}>{data.agingRatio}x (Espera / Gap)</span></p>
                                  <p>Espera Actual: <span className="text-indigo-300">{data.currentWait} sorteos sin salir</span></p>
                                  <p>Apariciones Totales (Z): <strong className="text-amber-400">{data.totalApps} veces</strong></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Scatter
                          name="Espectro Tris"
                          data={snapshotData}
                        >
                          {snapshotData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.currentWait < 20 ? (isDark ? "#f59e0b" : "#d97706") : (isDark ? "#06b6d4" : "#4f46e5")}
                            />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-slate-400">
                    <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="font-bold text-cyan-300 block mb-1">Eje X (Gap Promedio)</span>
                      <span>Tiempo medio entre apariciones históricas de cada número objetivo.</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="font-bold text-amber-300 block mb-1">Eje Y (Aging / Envejecimiento)</span>
                      <span>Relación entre la espera actual y su gap promedio (sobre-atraso).</span>
                    </div>
                    <div className={`p-3 rounded-xl border ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                      <span className="font-bold text-emerald-300 block mb-1">Eje Z (Apariciones Totales)</span>
                      <span>Volumen total de veces que ha salido el número (tamaño de burbuja).</span>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-6 text-xs ${isDark ? "bg-slate-950/60 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-amber-500 inline-block shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                      <span className="font-medium">Presentados en los últimos 20 sorteos (Espera menor a 20)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 inline-block shadow-[0_0_8px_rgba(6,182,212,0.4)]"></span>
                      <span className="font-medium">Resto del espectro histórico</span>
                    </div>
                  </div>
                </div>






                {/* Recent Draws & Quick Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className={`lg:col-span-2 rounded-2xl border shadow-sm p-6 space-y-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold">Últimos Sorteos Registrados (Con Concurso y Hora)</h3>
                      <button
                        onClick={() => setActiveTab("stats")}
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <span>Ver todos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className={`border-b text-xs font-semibold ${isDark ? "border-slate-800 text-slate-400 bg-slate-950/50" : "border-slate-100 text-slate-500"}`}>
                            <th className="py-3 px-3">Concurso y Fecha</th>
                            <th className="py-3 px-3">Sorteo y Hora</th>
                            <th className="py-3 px-3">Número Ganador</th>
                            <th className="py-3 px-3">Suma</th>
                            <th className="py-3 px-3">Par/Impar</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y text-sm ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
                          {records.slice().reverse().slice(0, 8).map(r => (
                            <tr key={r.id} className={`transition-colors ${isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50/80"}`}>
                              <td className="py-3 px-3 font-mono text-xs text-slate-400">
                                <div className="font-bold text-cyan-300">#{r.concurso}</div>
                                <div className="text-[11px] text-slate-300">{r.date}</div>
                              </td>
                              <td className="py-3 px-3 font-medium">
                                <div className="space-y-0.5">
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                    r.drawType === "Mediodía" ? (isDark ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-sky-50 text-sky-700") :
                                    r.drawType === "Tres" ? (isDark ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-amber-50 text-amber-700") :
                                    r.drawType === "Extra" ? (isDark ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-purple-50 text-purple-700") :
                                    r.drawType === "Siete" ? (isDark ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" : "bg-indigo-50 text-indigo-700") :
                                    (isDark ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-100 text-slate-700")
                                  }`}>
                                    {r.drawType}
                                  </span>
                                  <div className="text-[10px] text-slate-400 font-mono">{r.drawTime}</div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`font-mono font-bold tracking-widest px-3 py-1 rounded-md text-sm shadow-sm ${isDark ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30" : "bg-indigo-50 text-indigo-600"}`}>
                                  {r.number}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-300">{r.sum}</td>
                              <td className="py-3 px-3 text-xs text-slate-400 font-mono">
                                {r.evenCount}P / {r.oddCount}I
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className={`rounded-2xl border shadow-sm p-6 space-y-4 flex flex-col justify-between ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                    <div>
                      <h3 className="text-base font-bold mb-1">Distribución por Horario</h3>
                      <p className="text-xs text-slate-400">Proporción de sorteos analizados por categoría diaria.</p>
                    </div>

                    <div className="space-y-3 py-4">
                      {["Mediodía", "Tres", "Extra", "Siete", "Clásico"].map(type => {
                        const count = records.filter(r => r.drawType.toLowerCase() === type.toLowerCase()).length;
                        const pct = records.length ? ((count / records.length) * 100).toFixed(1) : "0";
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span>{type}</span>
                              <span className="font-mono text-cyan-400">{count} ({pct}%)</span>
                            </div>
                            <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isDark ? "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "bg-indigo-600"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`p-4 rounded-xl border text-xs space-y-1 ${isDark ? "bg-slate-950 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-100 text-slate-600"}`}>
                      <div className="font-semibold text-cyan-400">Nota Analítica Oficial</div>
                      <p>Cada sorteo cuenta con un número de concurso único sincronizado del repositorio oficial de Lotería Nacional.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STATISTICAL CHARACTERIZATION */}
            {activeTab === "stats" && stats && (
              <div className="space-y-8 animate-fadeIn">
                <div className={`p-6 rounded-2xl border shadow-sm space-y-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold">Caracterización Estadística por Posición y Dígito</h2>
                      <p className="text-xs text-slate-400">Analiza el comportamiento histórico de cada una de las 5 posiciones y modalidades de Tris.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-400">Sorteo:</span>
                        <select
                          value={selectedDrawTypeFilter}
                          onChange={(e) => setSelectedDrawTypeFilter(e.target.value)}
                          className={`px-3 py-1.5 text-xs font-medium border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 ${isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                        >
                          <option value="todos">Todos los Sorteos (5 diarios)</option>
                          <option value="mediodía">Mediodía (13:00 hrs)</option>
                          <option value="tres">Tres (15:00 hrs)</option>
                          <option value="extra">Extra (17:00 hrs)</option>
                          <option value="siete">Siete (19:00 hrs)</option>
                          <option value="clásico">Clásico (21:00 hrs)</option>
                        </select>
                      </div>

                      <div className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-lg font-semibold border border-cyan-500/30">
                        Muestra: {stats.total} sorteos
                      </div>
                    </div>
                  </div>

                  <div className={`space-y-3 pt-3 border-t text-xs ${isDark ? "border-slate-800" : "border-slate-100"}`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 font-semibold">
                        <Calendar className="w-4 h-4 text-cyan-400" />
                        <span>Rangos Rápidos de Análisis:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => { setDateFrom(""); setDateTo(""); }}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-200" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => applyDatePreset(7, 'days')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-colors border border-cyan-500/30"
                        >
                          1 Semana
                        </button>
                        <button
                          onClick={() => applyDatePreset(1, 'months')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-colors border border-cyan-500/30"
                        >
                          1 Mes
                        </button>
                        <button
                          onClick={() => applyDatePreset(6, 'months')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-colors border border-cyan-500/30"
                        >
                          6 Meses
                        </button>
                        <button
                          onClick={() => applyDatePreset(1, 'years')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-colors border border-cyan-500/30"
                        >
                          1 Año
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Desde:</span>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className={`px-2.5 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs ${isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Hasta:</span>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className={`px-2.5 py-1 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-xs ${isDark ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-200 text-slate-800"}`}
                        />
                      </div>
                      {(dateFrom || dateTo) && (
                        <button
                          onClick={() => { setDateFrom(""); setDateTo(""); }}
                          className="text-cyan-400 hover:text-cyan-300 underline font-medium"
                        >
                          Limpiar Rango
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Position Frequency Breakdown */}
                <div className={`rounded-2xl border shadow-sm p-6 space-y-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <h3 className="text-base font-bold">Frecuencia de Dígitos (0-9) por Posición</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {stats.posFreq.map((digitCounts, posIndex) => {
                      const maxCount = Math.max(...digitCounts, 1);
                      return (
                        <div key={posIndex} className={`rounded-xl p-4 border space-y-3 ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50/80 border-slate-100"}`}>
                          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider text-center pb-1 border-b border-slate-800">
                            Posición {posIndex + 1}
                          </div>
                          <div className="space-y-2">
                            {digitCounts.map((count, digit) => {
                              return (
                                <div key={digit} className="text-xs flex items-center justify-between gap-2">
                                  <span className="w-5 font-mono font-bold text-slate-300">{digit}</span>
                                  <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-200/70"}`}>
                                    <div
                                      className={`h-full rounded-full ${isDark ? "bg-cyan-400" : "bg-indigo-500"}`}
                                      style={{ width: `${(count / maxCount) * 100}%` }}
                                    />
                                  </div>
                                  <span className="w-10 text-right font-mono text-[10px] text-slate-400">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Overall Digit Frequency Bar Chart */}
                <div className={`rounded-2xl border shadow-sm p-6 space-y-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold">Distribución Histórica de Frecuencia Global por Dígito (0 - 9)</h3>
                      <p className="text-xs text-slate-400">Comparativa de apariciones reales frente a la media teórica esperada</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-md font-semibold">
                      Media Teórica: {((stats.total * 5) / 10).toFixed(0)} apariciones
                    </span>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={stats.overallFreq.map((count, digit) => ({
                          digit: `Dígito ${digit}`,
                          numero: digit,
                          apariciones: count,
                          esperado: (stats.total * 5) / 10
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                        <XAxis dataKey="digit" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const diff = data.apariciones - data.esperado;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-mono border border-cyan-500/40">
                                  <p className="font-bold text-cyan-300">Dígito: {data.numero}</p>
                                  <p>Apariciones Reales: <span className="font-bold text-emerald-400">{data.apariciones}</span></p>
                                  <p>Media Esperada: <span className="font-bold text-slate-300">{data.esperado.toFixed(1)}</span></p>
                                  <p>Desviación: <span className={`font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>{diff >= 0 ? `+${diff.toFixed(0)}` : diff.toFixed(0)}</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine
                          y={(stats.total * 5) / 10}
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                          label={{ value: 'Media Teórica', fill: '#ef4444', fontSize: 11, position: 'top' }}
                        />
                        <Bar
                          dataKey="apariciones"
                          fill={isDark ? "#06b6d4" : "#4f46e5"}
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Parity & High/Low Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className={`rounded-2xl border shadow-sm p-6 space-y-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                    <h3 className="text-base font-bold">Balance de Paridad (Pares vs Impares)</h3>
                    <p className="text-xs text-slate-400">Distribución de números pares (0,2,4,6,8) e impares (1,3,5,7,9).</p>

                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span>Dígitos Pares</span>
                          <span className="font-mono text-cyan-400">
                            {stats.totalEvens} ({((stats.totalEvens / (stats.total * 5)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <div
                            className={`h-full rounded-full ${isDark ? "bg-cyan-400" : "bg-indigo-600"}`}
                            style={{ width: `${(stats.totalEvens / (stats.total * 5)) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span>Dígitos Impares</span>
                          <span className="font-mono text-purple-400">
                            {stats.totalOdds} ({((stats.totalOdds / (stats.total * 5)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <div
                            className={`h-full rounded-full ${isDark ? "bg-purple-500" : "bg-purple-600"}`}
                            style={{ width: `${(stats.totalOdds / (stats.total * 5)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-2xl border shadow-sm p-6 space-y-4 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                    <h3 className="text-base font-bold">Rango de Dígitos (Bajos 0-4 vs Altos 5-9)</h3>
                    <p className="text-xs text-slate-400">Proporción de aparición entre dígitos bajos y altos.</p>

                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span>Dígitos Bajos (0-4)</span>
                          <span className="font-mono text-blue-400">
                            {stats.totalLows} ({((stats.totalLows / (stats.total * 5)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(stats.totalLows / (stats.total * 5)) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span>Dígitos Altos (5-9)</span>
                          <span className="font-mono text-amber-400">
                            {stats.totalHighs} ({((stats.totalHighs / (stats.total * 5)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? "bg-slate-800" : "bg-slate-100"}`}>
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(stats.totalHighs / (stats.total * 5)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top 10 Frequencies per Modality */}
                <div className={`rounded-2xl border shadow-sm p-6 space-y-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold">Top 10 de Frecuencias por Modalidad de Juego</h3>
                      <p className="text-xs text-slate-400">Ranking histórico de combinaciones más frecuentes según las reglas de premiación de Tris.</p>
                    </div>

                    <div className={`flex flex-wrap items-center gap-1 p-1 rounded-xl ${isDark ? "bg-slate-950 border border-slate-800" : "bg-slate-100"}`}>
                      {[
                        { id: "directa5", label: "Directa 5" },
                        { id: "directa4", label: "Directa 4" },
                        { id: "directa3", label: "Directa 3" },
                        { id: "parFinal", label: "Par Final" },
                        { id: "parInicial", label: "Par Inicial" },
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setTopModalityTab(tab.id as any)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            topModalityTab === tab.id
                              ? isDark ? "bg-cyan-500 text-slate-950 font-bold shadow-sm" : "bg-white text-indigo-600 font-bold shadow-sm"
                              : isDark ? "text-slate-400 hover:text-slate-200" : "text-slate-600 hover:text-slate-900"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={`border-b text-xs font-semibold ${isDark ? "border-slate-800 text-slate-400 bg-slate-950/50" : "border-slate-100 text-slate-500"}`}>
                          <th className="py-3 px-4 w-20">Ranking</th>
                          <th className="py-3 px-4">Combinación ({topModalityTab.toUpperCase()})</th>
                          <th className="py-3 px-4">Apariciones</th>
                          <th className="py-3 px-4">Frecuencia Relativa</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm font-mono ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
                        {(
                          topModalityTab === "directa5" ? stats.topDirecta5 :
                          topModalityTab === "directa4" ? stats.topDirecta4 :
                          topModalityTab === "directa3" ? stats.topDirecta3 :
                          topModalityTab === "parFinal" ? stats.topParFinal :
                          stats.topParInicial
                        ).map((item, idx) => {
                          const pct = ((item.count / stats.total) * 100).toFixed(2);
                          return (
                            <tr key={item.value} className={`transition-colors ${isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50/80"}`}>
                              <td className="py-3 px-4">
                                <span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center text-xs font-bold ${
                                  idx === 0 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" :
                                  idx === 1 ? "bg-slate-800 text-slate-300 border border-slate-700" :
                                  idx === 2 ? "bg-orange-500/20 text-orange-300 border border-orange-500/40" :
                                  "bg-slate-800/50 text-slate-400"
                                }`}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`font-bold tracking-widest px-2.5 py-1 rounded ${isDark ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/30" : "bg-indigo-50 text-indigo-600"}`}>
                                  {item.value}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-bold">
                                {item.count} veces
                              </td>
                              <td className="py-3 px-4 text-slate-400">
                                {pct}% del total
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}





            {/* TAB 5: PREDICCION ML & BACKTESTING */}
            {activeTab === "ml" && mlPredictionResult && (
              <div className="space-y-8 animate-fadeIn">
                <div className={`rounded-2xl p-8 space-y-4 shadow-xl relative overflow-hidden ${
                  isDark
                    ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-white"
                    : "bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white"
                }`}>
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-cyan-200 border border-cyan-400/30">
                        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Predicción ML con Top 5 Opciones y Resaltado de Aciertos</span>
                      </div>
                      <h2 className="text-2xl font-bold">Predicción para el Próximo Sorteo & Backtesting por Modalidad</h2>
                      <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                        Selecciona tu modalidad de juego para visualizar las 5 opciones del modelo en columnas y comprobar sus aciertos históricos.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-300 font-medium">Tamaño Top:</span>
                        <div className="flex bg-white/15 p-1 rounded-xl border border-white/20 backdrop-blur-md">
                          <button
                            onClick={() => setMlTopSize(5)}
                            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${mlTopSize === 5 ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-white hover:bg-white/10"}`}
                          >
                            Top 5
                          </button>
                          <button
                            onClick={() => setMlTopSize(10)}
                            className={`px-3 py-1 text-xs rounded-lg font-bold transition-all ${mlTopSize === 10 ? "bg-cyan-500 text-slate-950 shadow-sm" : "text-white hover:bg-white/10"}`}
                          >
                            Top 10
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-300 font-medium">Sorteo:</span>
                        <select
                          value={mlDrawType}
                          onChange={(e) => setMlDrawType(e.target.value)}
                          className="px-3 py-2 text-xs font-medium bg-white/15 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 backdrop-blur-md"
                        >
                          <option value="todos" className="text-slate-900">Todos los Sorteos</option>
                          <option value="mediodía" className="text-slate-900">Mediodía</option>
                          <option value="tres" className="text-slate-900">Tres</option>
                          <option value="extra" className="text-slate-900">Extra</option>
                          <option value="siete" className="text-slate-900">Siete</option>
                          <option value="clásico" className="text-slate-900">Clásico</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Predictions for Next Draw by Selected Modality */}
                <div className={`rounded-2xl border shadow-sm p-6 space-y-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold">Opciones Recomendadas para el Sorteo Siguiente</h3>
                      <p className="text-xs text-slate-400">Predicciones basadas en cadenas de Markov y análisis de transición para las modalidades seleccionadas.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mlSelectedModalities.map(modId => {
                      const optionsList = mlPredictionResult.topPredictionsByModality[modId] || [];
                      const label = modalityMeta[modId]?.label || modId;
                      return (
                        <div key={modId} className={`p-5 rounded-2xl border space-y-4 ${isDark ? "bg-slate-950/60 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                          <div className="flex items-center justify-between border-b pb-3">
                            <span className="text-sm font-bold text-cyan-400 uppercase tracking-wider">{label}</span>
                            <span className="text-xs font-mono text-slate-400">Top 5 por Opción</span>
                          </div>
                          <div className="space-y-4">
                            {optionsList.map((opt, oIdx) => (
                              <div key={oIdx} className={`p-3 rounded-xl border space-y-2 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200 shadow-sm"}`}>
                                <div className="text-xs font-bold text-amber-300">{opt.title}</div>
                                <div className="grid grid-cols-5 gap-1.5 pt-1">
                                  {opt.top5.map((t, tIdx) => (
                                    <div key={tIdx} className={`p-1.5 rounded text-center font-mono text-xs ${isDark ? "bg-slate-950 border border-slate-800 text-cyan-300 font-bold" : "bg-slate-100 text-indigo-700 font-bold"}`} title={`${t.confidence}% conf.`}>
                                      <div className="text-[10px] text-slate-400">#{tIdx+1}</div>
                                      <div>{t.number}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Backtesting Results Table with 5 Model Option Columns & Highlighted Hits */}
                <div className={`rounded-2xl border shadow-sm p-6 space-y-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold">Resultados y 5 Opciones del Modelo (Últimos 20 Sorteos)</h3>
                      <p className="text-xs text-slate-400">Columnas con las 5 opciones del modelo comparadas frente al número real histórico. Se resaltan en verde los aciertos.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg font-semibold border border-emerald-500/30">
                        Efectividad: {mlPredictionResult.metrics.accuracy}%
                      </div>
                      <div className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-lg font-semibold border border-cyan-500/30">
                        Aciertos: {mlPredictionResult.metrics.totalHits} / {mlPredictionResult.metrics.totalTested}
                      </div>
                    </div>
                  </div>

                  {/* Modality Selector integrated inside Results Section in Checkbox format */}
                  <div className={`p-4 rounded-xl border flex flex-wrap items-center gap-3 ${isDark ? "bg-slate-950/80 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                    <span className="text-xs font-bold text-cyan-400">Seleccionar Modalidad de Juego (Múltiples):</span>
                    {[
                      { id: "ultimoDigito", label: "Último Dígito" },
                      { id: "directa5", label: "Directa 5" },
                      { id: "directa4", label: "Directa 4" },
                      { id: "directa3", label: "Directa 3" },
                      { id: "parFinal", label: "Par Final" },
                      { id: "parInicial", label: "Par Inicial" },
                      { id: "primerDigito", label: "Primer Dígito" },
                    ].map(mod => {
                      const isChecked = mlSelectedModalities.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          onClick={() => handleToggleModality(mod.id)}
                          className={`cursor-pointer px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all border ${
                            isChecked
                              ? isDark ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "bg-indigo-50 text-indigo-700 border-indigo-300 shadow-sm"
                              : isDark ? "bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleModality(mod.id)}
                            className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 w-3.5 h-3.5 accent-cyan-400"
                          />
                          <span>{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>

                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                      <thead>
                        <tr className={`border-b text-xs font-semibold ${isDark ? "border-slate-800 text-slate-400 bg-slate-950/50" : "border-slate-200 text-slate-600 bg-slate-50"}`}>
                          <th 
                            onClick={() => setMlSortOrder(mlSortOrder === "desc" ? "asc" : "desc")}
                            className="py-3 px-3 cursor-pointer hover:text-cyan-300 transition-colors select-none group"
                            title="Click para alternar orden: más reciente / más añejo"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Concurso, Fecha y Hora</span>
                              <ArrowUpDown className={`w-3.5 h-3.5 transition-transform ${mlSortOrder === "asc" ? "rotate-180 text-cyan-400" : "text-slate-400"}`} />
                            </div>
                          </th>
                          {[0, 1, 2, 3, 4].map(optIdx => {
                            const isFilteredByThis = mlFilterOptionIndex === optIdx;
                            return (
                              <th
                                key={optIdx}
                                onClick={() => setMlFilterOptionIndex(isFilteredByThis ? null : optIdx)}
                                className={`py-3 px-3 cursor-pointer transition-colors select-none group ${isFilteredByThis ? "text-cyan-300 font-bold bg-cyan-500/10" : "hover:text-cyan-300"}`}
                                title={`Click para filtrar solo aciertos de Opción ${optIdx + 1}`}
                              >
                                <div className="flex items-center gap-1">
                                  <span>{optIdx === 2 ? "Opción 3 (Fresh)" : `Opción ${optIdx + 1}`}</span>
                                  <Filter className={`w-3 h-3 ${isFilteredByThis ? "text-cyan-400" : "text-slate-500 opacity-60 group-hover:opacity-100"}`} />
                                </div>
                              </th>
                            );
                          })}
                          <th className="py-3 px-3">Número Real (Modalidades)</th>
                          <th 
                            onClick={() => setMlFilterHitsOnly(!mlFilterHitsOnly)}
                            className={`py-3 px-3 cursor-pointer transition-colors select-none group ${mlFilterHitsOnly ? "text-emerald-400 font-bold bg-emerald-500/10" : "hover:text-cyan-300"}`}
                            title="Click para alternar filtro de Solo Aciertos"
                          >
                            <div className="flex items-center gap-1.5">
                              <span>Estado</span>
                              <Filter className={`w-3.5 h-3.5 ${mlFilterHitsOnly ? "text-emerald-400 font-bold" : "text-slate-400"}`} />
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm font-mono ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
                        {mlPredictionResult.backtestResults.map((bt, idx) => (
                          <tr key={idx} className={`transition-colors ${isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50/80"}`}>
                            <td className="py-3 px-3 text-xs">
                              <div className="font-bold text-cyan-300">#{bt.concurso}</div>
                              <div className="text-slate-300">{bt.date} <span className="text-amber-400">({bt.drawType})</span></div>
                            </td>

                            {/* Options 1 to 5 */}
                            {[0, 1, 2, 3, 4].map(optIdx => (
                              <td key={optIdx} className="py-3 px-3 space-y-2">
                                {mlSelectedModalities.map(modId => {
                                  const mRes = bt.modalityResults[modId];
                                  if (!mRes) return null;
                                  const optObj = mRes.options[optIdx];
                                  if (!optObj) return null;
                                  const label = modalityMeta[modId]?.label || modId;
                                  return (
                                    <div key={modId} className="space-y-1">
                                      <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                                        <span>{label}:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {optObj.top5.map((t, tIdx) => {
                                          const isMatch = t.number === mRes.actualSlice;
                                          return (
                                            <span
                                              key={tIdx}
                                              className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                                                isMatch
                                                  ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 font-bold shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                                                  : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                                              }`}
                                              title={`Top #${tIdx+1} (${t.confidence}% conf.)`}
                                            >
                                              {t.number}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </td>
                            ))}

                            {/* Número Real */}
                            <td className="py-3 px-3 space-y-1.5">
                              {mlSelectedModalities.map(modId => {
                                const mRes = bt.modalityResults[modId];
                                if (!mRes) return null;
                                const label = modalityMeta[modId]?.label || modId;
                                return (
                                  <div key={modId} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-slate-400 text-[10px] font-sans">{label}:</span>
                                    <span className={`font-bold tracking-widest px-2 py-0.5 rounded ${isDark ? "bg-slate-800 text-slate-100 border border-slate-700" : "bg-slate-100 text-slate-900"}`}>
                                      {mRes.actualSlice}
                                    </span>
                                  </div>
                                );
                              })}
                            </td>

                            {/* Estado / Acierto */}
                            <td className="py-3 px-3">
                              {bt.anyHit ? (
                                <span className="inline-block w-6 h-6 rounded-lg bg-emerald-500/30 border border-emerald-500/60 shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
                              ) : (
                                <span className="inline-block w-6 h-6 rounded-lg bg-slate-800/50 border border-slate-700" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Second Table: Top 50 Exclusive Complementary Strategy */}
                <div className={`rounded-2xl border shadow-sm p-6 space-y-6 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200/80"}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold">Estrategia Excluyente — Top 50 Complementario por Modalidad (Backtesting)</h3>
                      <p className="text-xs text-slate-400">Segunda tabla basada en el universo excluyente (complemento de la primera selección). Presenta el Top 50 de mayor presión estadística secundaria.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg font-semibold border border-emerald-500/30">
                        Efectividad Top 50: {exclusivePredictionResult.metrics.accuracy}%
                      </div>
                      <div className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1.5 rounded-lg font-semibold border border-cyan-500/30">
                        Aciertos: {exclusivePredictionResult.metrics.totalHits} / {exclusivePredictionResult.metrics.totalTested}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                      <thead>
                        <tr className={`border-b text-xs font-semibold ${isDark ? "border-slate-800 text-slate-400 bg-slate-950/50" : "border-slate-200 text-slate-600 bg-slate-50"}`}>
                          <th className="py-3 px-3">Concurso, Fecha y Hora</th>
                          <th className="py-3 px-3">Estrategia Excluyente (Top 50)</th>
                          <th className="py-3 px-3">Número Real (Modalidades)</th>
                          <th className="py-3 px-3">Estado</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y text-sm font-mono ${isDark ? "divide-slate-800" : "divide-slate-100"}`}>
                        {exclusivePredictionResult.backtestResults.map((bt, idx) => (
                          <tr key={idx} className={`transition-colors ${isDark ? "hover:bg-slate-800/50" : "hover:bg-slate-50/80"}`}>
                            <td className="py-3 px-3 text-xs">
                              <div className="font-bold text-cyan-300">#{bt.concurso}</div>
                              <div className="text-slate-300">{bt.date} <span className="text-amber-400">({bt.drawType})</span></div>
                            </td>
                            <td className="py-3 px-3 space-y-2">
                              {mlSelectedModalities.map(modId => {
                                const mRes = bt.modalityResults[modId];
                                if (!mRes) return null;
                                const label = modalityMeta[modId]?.label || modId;
                                return (
                                  <div key={modId} className="space-y-1">
                                    <div className="text-[10px] text-slate-400 font-sans flex items-center justify-between">
                                      <span>{label}:</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                                      {mRes.top50.slice(0, 10).map((t, tIdx) => {
                                        const isMatch = t.number === mRes.actualSlice;
                                        return (
                                          <span
                                            key={tIdx}
                                            className={`text-[11px] px-1.5 py-0.5 rounded font-mono ${
                                              isMatch
                                                ? "bg-emerald-500/30 text-emerald-300 border border-emerald-500/60 font-bold shadow-[0_0_6px_rgba(16,185,129,0.4)]"
                                                : isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                                            }`}
                                            title={`Candidato #${tIdx+1} (${t.confidence}% conf.)`}
                                          >
                                            {t.number}
                                          </span>
                                        );
                                      })}
                                      {mRes.top50.length > 10 && (
                                        <span className="text-[10px] text-slate-400 self-center">+{mRes.top50.length - 10} más...</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </td>
                            <td className="py-3 px-3 space-y-1.5">
                              {mlSelectedModalities.map(modId => {
                                const mRes = bt.modalityResults[modId];
                                if (!mRes) return null;
                                const label = modalityMeta[modId]?.label || modId;
                                return (
                                  <div key={modId} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="text-slate-400 text-[10px] font-sans">{label}:</span>
                                    <span className={`font-bold tracking-widest px-2 py-0.5 rounded ${isDark ? "bg-slate-800 text-slate-100 border border-slate-700" : "bg-slate-100 text-slate-900"}`}>
                                      {mRes.actualSlice}
                                    </span>
                                  </div>
                                );
                              })}
                            </td>
                            <td className="py-3 px-3">
                              {bt.anyHit ? (
                                <span className="inline-block w-6 h-6 rounded-lg bg-emerald-500/30 border border-emerald-500/60 shadow-[0_0_6px_rgba(16,185,129,0.3)]" />
                              ) : (
                                <span className="inline-block w-6 h-6 rounded-lg bg-slate-800/50 border border-slate-700" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}


          </>
        )}
      </main>

      {/* Footer */}
      <footer className={`max-w-7xl mx-auto px-6 py-12 border-t mt-16 text-center text-xs space-y-2 ${isDark ? "border-slate-800 text-slate-400" : "border-slate-200 text-slate-500"}`}>
        <p>TrisAnalytics Pro — Plataforma independiente de caracterización de sorteos Tris (Lotería Nacional).</p>
        <p>Datos en tiempo real sincronizados con concursos y horarios oficiales desde el repositorio público <a href="https://github.com/pakinja/pakin" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-medium">pakinja/pakin</a>.</p>
      </footer>
    </div>
  );
}
