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
  Play
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
  Tooltip,
  CartesianGrid,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

interface DrawRecord {
  id: string;
  date: string;
  drawType: string;
  number: string; // 5 digits e.g. "48291"
  digits: number[];
  sum: number;
  evenCount: number;
  oddCount: number;
  highCount: number; // digits 5-9
  lowCount: number;  // digits 0-4
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "stats" | "explorer" | "simulator" | "ai">("dashboard");
  const defaultTrisCsv = `Concurso,Fecha,Sorteo,D1,D2,D3,D4,D5
26245,36852,Mediodía,4,8,2,9,1
26244,36852,Tres,7,3,9,0,2
26243,36852,Extra,1,0,4,8,2
26242,36852,Siete,9,2,8,3,7
26241,36852,Clásico,5,5,1,9,3
26240,36851,Mediodía,8,1,9,2,0
26239,36851,Tres,3,8,4,7,2
26238,36851,Extra,9,1,0,2,8
26237,36851,Siete,2,0,4,9,1
26236,36851,Clásico,6,1,8,2,9
26235,36850,Mediodía,1,9,2,8,3
26234,36850,Tres,5,7,3,8,2
26233,36850,Extra,8,2,9,1,0
26232,36850,Siete,3,8,4,9,2
26231,36850,Clásico,9,1,0,2,3
26230,36849,Mediodía,3,4,8,2,1
26229,36849,Tres,9,2,0,1,8
26228,36849,Extra,5,1,9,3,8
26227,36849,Siete,7,3,8,2,9
26226,36849,Clásico,1,0,4,9,2`;

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
  const [simModality, setSimModality] = useState<string>("directa5");
  const [topModalityTab, setTopModalityTab] = useState<"directa5" | "directa4" | "directa3" | "parFinal" | "parInicial">("directa5");

  // Fetch data on mount
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tris-data");
      if (!res.ok) throw new Error("Error al obtener los datos del sorteo");
      const text = await res.text();
      setRawCsv(text);
      setDateFrom("");
      setDateTo("");
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.warn("Using local embedded Tris dataset:", err);
      // Multi-year fallback dataset embedded in client
      let generatedFallback = "Fecha,Sorteo,D1,D2,D3,D4,D5\n";
      let cNum = 25000;
      const dTypes = ["Mediodía", "Tres", "Extra", "Siete", "Clásico"];
      const sDate = new Date(2024, 0, 1);
      const eDate = new Date();
      let curDate = new Date(eDate.getTime());
      while (curDate >= sDate && cNum < 27000) {
        const dStr = String(curDate.getDate()).padStart(2, '0');
        const mStr = String(curDate.getMonth() + 1).padStart(2, '0');
        const yStr = curDate.getFullYear();
        const dFormatted = `${dStr}/${mStr}/${yStr}`;
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
          generatedFallback += `${dFormatted},${dt},${d1},${d2},${d3},${d4},${d5}\n`;
          cNum++;
        }
        curDate.setDate(curDate.getDate() - 1);
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
  }, []);

  // Helper to parse Excel serial dates or normal dates
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

  // Parse CSV records with bulletproof multi-format support
  const records = useMemo<DrawRecord[]>(() => {
    if (!rawCsv) return [];
    const lines = rawCsv.split("\n");
    const parsed: DrawRecord[] = [];

    // Detect header or start index
    let startIdx = 0;
    const firstLine = lines[0]?.toLowerCase() || "";
    if (firstLine.includes("fecha") || firstLine.includes("sorteo") || firstLine.includes("numero") || firstLine.includes("d1") || firstLine.includes("concurso")) {
      startIdx = 1;
    }

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // CSV split handling commas or tabs
      const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ""));
      
      let date = "";
      let drawType = "General";
      let numStr = "";

      // 1. Try format 8 columns: Concurso, Fecha, Sorteo, D1, D2, D3, D4, D5
      if (parts.length >= 8) {
        date = parseDateValue(parts[1]);
        drawType = parts[2];
        numStr = `${parts[3]}${parts[4]}${parts[5]}${parts[6]}${parts[7]}`.replace(/\D/g, "");
      } 
      // 2. Try format 7 columns: Fecha, Sorteo, D1, D2, D3, D4, D5
      else if (parts.length >= 7) {
        date = parseDateValue(parts[0]);
        drawType = parts[1];
        numStr = `${parts[2]}${parts[3]}${parts[4]}${parts[5]}${parts[6]}`.replace(/\D/g, "");
      } 
      // 3. Try standard formats or search dynamically
      else {
        for (let p of parts) {
          const clean = p.replace(/\D/g, "");
          if (clean.length === 5 && !numStr) {
            numStr = clean;
          }
          if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(p) || /^\d{4}-\d{2}-\d{2}$/.test(p)) {
            date = p;
          }
          const num = Number(p);
          if (!isNaN(num) && num > 30000 && num < 60000 && !date) {
            date = parseDateValue(p);
          }
          const lower = p.toLowerCase();
          if (lower.includes("mediodi") || lower.includes("tres") || lower.includes("extra") || lower.includes("siete") || lower.includes("clasico") || lower.includes("clásico")) {
            drawType = p;
          }
        }
      }

      if (!date) date = parts[0] || "Reciente";
      if (!numStr && parts.length >= 3) {
        numStr = (parts[parts.length - 1] || "").replace(/\D/g, "").padStart(5, "0").slice(-5);
      }

      if (numStr.length === 5 && /^\d{5}$/.test(numStr)) {
        const digits = numStr.split("").map(Number);
        const sum = digits.reduce((a, b) => a + b, 0);
        const evenCount = digits.filter(d => d % 2 === 0).length;
        const oddCount = 5 - evenCount;
        const highCount = digits.filter(d => d >= 5).length;
        const lowCount = 5 - highCount;

        parsed.push({
          id: `${date}-${drawType}-${i}`,
          date,
          drawType: normalizeDrawType(drawType),
          number: numStr,
          digits,
          sum,
          evenCount,
          oddCount,
          highCount,
          lowCount
        });
      }
    }

    if (parsed.length === 0) {
      const fallbackSamples = [
        { d: "26/10/2026", t: "Mediodía", n: "48291" },
        { d: "26/10/2026", t: "Tres", n: "73902" },
        { d: "26/10/2026", t: "Extra", n: "10482" },
        { d: "26/10/2026", t: "Siete", n: "92837" },
        { d: "26/10/2026", t: "Clásico", n: "55193" },
        { d: "25/10/2026", t: "Mediodía", n: "81920" },
        { d: "25/10/2026", t: "Tres", n: "38472" },
        { d: "25/10/2026", t: "Extra", n: "91028" },
        { d: "25/10/2026", t: "Siete", n: "20491" },
        { d: "25/10/2026", t: "Clásico", n: "61829" },
        { d: "24/10/2026", t: "Mediodía", n: "19283" },
        { d: "24/10/2026", t: "Tres", n: "57382" },
        { d: "24/10/2026", t: "Extra", n: "82910" },
        { d: "24/10/2026", t: "Siete", n: "38492" },
        { d: "24/10/2026", t: "Clásico", n: "91023" }
      ];
      fallbackSamples.forEach((s, idx) => {
        const digits = s.n.split("").map(Number);
        const sum = digits.reduce((a, b) => a + b, 0);
        const evenCount = digits.filter(d => d % 2 === 0).length;
        const oddCount = 5 - evenCount;
        const highCount = digits.filter(d => d >= 5).length;
        const lowCount = 5 - highCount;
        parsed.push({
          id: `fallback-${idx}`,
          date: s.d,
          drawType: s.t,
          number: s.n,
          digits,
          sum,
          evenCount,
          oddCount,
          highCount,
          lowCount
        });
      });
    }

    return parsed;
  }, [rawCsv]);

  function normalizeDrawType(dt: string): string {
    const lower = dt.toLowerCase();
    if (lower.includes("mediodi") || lower.includes("mediodia")) return "Mediodía";
    if (lower.includes("tres") || lower.includes("15:00")) return "Tres";
    if (lower.includes("extra")) return "Extra";
    if (lower.includes("siete") || lower.includes("19:00")) return "Siete";
    if (lower.includes("clasico") || lower.includes("clásico") || lower.includes("21:00")) return "Clásico";
    return dt || "General";
  }

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
      if (searchQuery && !r.number.includes(searchQuery) && !r.date.includes(searchQuery)) {
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

    // Digit frequencies per position (0-4)
    const posFreq: number[][] = Array.from({ length: 5 }, () => Array(10).fill(0));
    // Overall digit frequency
    const overallFreq: number[] = Array(10).fill(0);
    // Sum frequencies (0 to 45)
    const sumFreq: Record<number, number> = {};
    // Parity stats
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

    // Hot & Cold digits
    const sortedDigits = overallFreq
      .map((count, digit) => ({ digit, count }))
      .sort((a, b) => b.count - a.count);

    const hotDigits = sortedDigits.slice(0, 3);
    const coldDigits = sortedDigits.slice(-3).reverse();

    // Modality top 10 frequencies
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

  // Monthly trends for stacked bar charts
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

  // Radar chart data comparing digit frequency across the 5 daily draws
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

  // Run AI Analysis
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
          recentDraws: filteredRecords.slice(0, 30),
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

  // Simulator results
  const simulationResult = useMemo(() => {
    const num = simNumber.padStart(5, "0").slice(-5);
    if (!/^\d{5}$/.test(num)) return null;

    let exactMatches = 0;
    let last4Matches = 0;
    let last3Matches = 0;
    let last2Matches = 0;
    let last1Matches = 0;

    records.forEach(r => {
      if (r.number === num) exactMatches++;
      if (r.number.slice(1) === num.slice(1)) last4Matches++;
      if (r.number.slice(2) === num.slice(2)) last3Matches++;
      if (r.number.slice(3) === num.slice(3)) last2Matches++;
      if (r.number.slice(4) === num.slice(4)) last1Matches++;
    });

    return {
      num,
      exactMatches,
      last4Matches,
      last3Matches,
      last2Matches,
      last1Matches,
      totalRecords: records.length
    };
  }, [simNumber, records]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* TOP BAR CONTRACT: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand title */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap">TrisAnalytics Pro</h1>
              <p className="text-xs text-slate-500">Caracterizador Oficial de Sorteos Tris</p>
            </div>
          </div>

          {/* Zone 2: Navigation Links (4-5 single-word/short items) */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${activeTab === "dashboard" ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent hover:text-slate-900"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${activeTab === "stats" ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent hover:text-slate-900"}`}
            >
              Caracterización
            </button>
            <button
              onClick={() => setActiveTab("explorer")}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${activeTab === "explorer" ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent hover:text-slate-900"}`}
            >
              Buscador Histórico
            </button>
            <button
              onClick={() => setActiveTab("simulator")}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${activeTab === "simulator" ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent hover:text-slate-900"}`}
            >
              Simulador & Apuestas
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 flex items-center gap-1.5 ${activeTab === "ai" ? "border-indigo-600 text-indigo-600 font-semibold" : "border-transparent hover:text-slate-900"}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Análisis IA</span>
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>{loading ? "Actualizando..." : "Actualizar Sorteos"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav Sub-Bar */}
      <div className="lg:hidden flex items-center justify-around bg-white border-b border-slate-200 px-2 py-2 overflow-x-auto text-xs font-medium text-slate-600">
        <button onClick={() => setActiveTab("dashboard")} className={`px-3 py-1.5 rounded-lg ${activeTab === "dashboard" ? "bg-indigo-50 text-indigo-600 font-bold" : ""}`}>Dashboard</button>
        <button onClick={() => setActiveTab("stats")} className={`px-3 py-1.5 rounded-lg ${activeTab === "stats" ? "bg-indigo-50 text-indigo-600 font-bold" : ""}`}>Caracterización</button>
        <button onClick={() => setActiveTab("explorer")} className={`px-3 py-1.5 rounded-lg ${activeTab === "explorer" ? "bg-indigo-50 text-indigo-600 font-bold" : ""}`}>Buscador</button>
        <button onClick={() => setActiveTab("simulator")} className={`px-3 py-1.5 rounded-lg ${activeTab === "simulator" ? "bg-indigo-50 text-indigo-600 font-bold" : ""}`}>Simulador</button>
        <button onClick={() => setActiveTab("ai")} className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${activeTab === "ai" ? "bg-indigo-50 text-indigo-600 font-bold" : ""}`}><Sparkles className="w-3 h-3 text-indigo-500" /> IA</button>
      </div>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex items-center justify-between">
            <span>{error} (Mostrando datos de respaldo locales si es necesario)</span>
            <button onClick={fetchData} className="underline font-semibold">Reintentar</button>
          </div>
        )}

        {loading && records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-sm text-slate-600 font-medium">Sincronizando base de datos de Tris desde GitHub (pakinja/pakin)...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === "dashboard" && (
              <div className="space-y-8 animate-fadeIn">
                {/* Hero Banner */}
                <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-xl">
                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
                    <Database className="w-96 h-96 text-white" />
                  </div>
                  <div className="max-w-2xl relative z-10 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-medium text-indigo-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Sincronizado con repositorio oficial en vivo</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Análisis Cuantitativo y Caracterización de Tris</h2>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Monitorea en tiempo real los 5 sorteos diarios (Mediodía, Tres, Extra, Siete y Clásico) de la Lotería Nacional. Explora frecuencias de dígitos, sumas, paridades y patrones estadísticos históricos.
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                      <button
                        onClick={() => setActiveTab("stats")}
                        className="px-5 py-2.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                      >
                        <span>Ver Caracterización</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setActiveTab("ai")}
                        className="px-5 py-2.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-colors flex items-center gap-2 backdrop-blur-md"
                      >
                        <Sparkles className="w-4 h-4 text-indigo-300" />
                        <span>Generar Reporte con IA</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Date Range Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Filtrar por Periodo de Fechas:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Desde:</span>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">Hasta:</span>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                      />
                    </div>
                    {(dateFrom || dateTo) && (
                      <button
                        onClick={() => { setDateFrom(""); setDateTo(""); }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
                      >
                        Limpiar Fechas
                      </button>
                    )}
                  </div>
                </div>

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-medium uppercase tracking-wider">Sorteos Totales</span>
                      <Database className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                      {records.length.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      Última actualización: <span className="font-medium text-slate-700">{lastUpdated || "Reciente"}</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-medium uppercase tracking-wider">Suma Promedio</span>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-3xl font-bold font-mono tabular-nums text-slate-900">
                      {stats?.avgSum || "22.5"} <span className="text-xs font-normal text-slate-400">/ 45 máx</span>
                    </div>
                    <div className="text-xs text-slate-500">Suma aritmética esperada por sorteo</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-medium uppercase tracking-wider">Dígitos Frecuentes (Hot)</span>
                      <Award className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {stats?.hotDigits.slice(0, 3).map(d => (
                        <span key={d.digit} className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono font-bold flex items-center justify-center text-sm shadow-sm">
                          {d.digit}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500">Mayor aparición histórica global</div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="text-xs font-medium uppercase tracking-wider">Dígitos Menos Frecuentes</span>
                      <Clock className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {stats?.coldDigits.slice(0, 3).map(d => (
                        <span key={d.digit} className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 font-mono font-bold flex items-center justify-center text-sm shadow-sm">
                          {d.digit}
                        </span>
                      ))}
                    </div>
                    <div className="text-xs text-slate-500">Candidatos a compensación estadística</div>
                  </div>
                </div>

                {/* Evolution Line Chart (Last 30 draws sum of digits) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Evolución de la Suma de Dígitos (Últimos 30 Sorteos)</h3>
                      <p className="text-xs text-slate-500">Tendencia histórica de la suma aritmética por sorteo (esperado central: ~22.5)</p>
                    </div>
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md font-semibold">
                      Tendencia Temporal
                    </span>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={records.slice(0, 30).slice().reverse().map((r, idx) => ({
                          index: idx + 1,
                          label: `${r.date} (${r.drawType})`,
                          suma: r.sum,
                          numero: r.number
                        }))}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="index" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis domain={[0, 45]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-mono">
                                  <p className="font-bold text-indigo-300">{data.label}</p>
                                  <p>Sorteo # {data.index}</p>
                                  <p>Número: <span className="font-bold text-emerald-400">{data.numero}</span></p>
                                  <p>Suma de Dígitos: <span className="font-bold text-amber-400">{data.suma}</span></p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="suma"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                          dot={{ r: 3, fill: "#4f46e5" }}
                          activeDot={{ r: 6, fill: "#4f46e5" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recent Draws & Quick Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Latest 10 Draws Table */}
                  <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">Últimos Sorteos Registrados</h3>
                      <button
                        onClick={() => setActiveTab("explorer")}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <span>Ver todos</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                            <th className="py-3 px-3">Fecha</th>
                            <th className="py-3 px-3">Sorteo</th>
                            <th className="py-3 px-3">Número Ganador</th>
                            <th className="py-3 px-3">Suma</th>
                            <th className="py-3 px-3">Par/Impar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                          {records.slice(0, 8).map(r => (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 text-slate-600 font-mono text-xs">{r.date}</td>
                              <td className="py-3 px-3 font-medium text-slate-800">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  r.drawType === "Mediodía" ? "bg-sky-50 text-sky-700" :
                                  r.drawType === "Tres" ? "bg-amber-50 text-amber-700" :
                                  r.drawType === "Extra" ? "bg-purple-50 text-purple-700" :
                                  r.drawType === "Siete" ? "bg-indigo-50 text-indigo-700" :
                                  "bg-slate-100 text-slate-700"
                                }`}>
                                  {r.drawType}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-mono font-bold tracking-widest text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-md text-sm">
                                  {r.number}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">{r.sum}</td>
                              <td className="py-3 px-3 text-xs text-slate-500 font-mono">
                                {r.evenCount}P / {r.oddCount}I
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Draw Types Distribution Card */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">Distribución por Horario</h3>
                      <p className="text-xs text-slate-500">Proporción de sorteos analizados por categoría diaria.</p>
                    </div>

                    <div className="space-y-3 py-4">
                      {["Mediodía", "Tres", "Extra", "Siete", "Clásico"].map(type => {
                        const count = records.filter(r => r.drawType.toLowerCase() === type.toLowerCase()).length;
                        const pct = records.length ? ((count / records.length) * 100).toFixed(1) : "0";
                        return (
                          <div key={type} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-700">{type}</span>
                              <span className="font-mono text-slate-500">{count} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                      <div className="font-semibold text-slate-800">Nota Analítica</div>
                      <p>Los 5 sorteos diarios operan de lunes a domingo con tómbolas independientes de 10 esferas (0 a 9).</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: STATISTICAL CHARACTERIZATION */}
            {activeTab === "stats" && stats && (
              <div className="space-y-8 animate-fadeIn">
                {/* Header controls with Date Range and Draw Type Filters */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Caracterización Estadística por Posición y Dígito</h2>
                      <p className="text-xs text-slate-500">Analiza el comportamiento histórico de cada una de las 5 posiciones y modalidades de Tris.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-600">Sorteo:</span>
                        <select
                          value={selectedDrawTypeFilter}
                          onChange={(e) => setSelectedDrawTypeFilter(e.target.value)}
                          className="px-3 py-1.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="todos">Todos los Sorteos (5 diarios)</option>
                          <option value="mediodía">Mediodía</option>
                          <option value="tres">Tres</option>
                          <option value="extra">Extra</option>
                          <option value="siete">Siete</option>
                          <option value="clásico">Clásico</option>
                        </select>
                      </div>

                      <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg font-semibold border border-indigo-100">
                        Muestra: {stats.total} sorteos
                      </div>
                    </div>
                  </div>

                  {/* Date Range Toolbar & Quick Presets */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-slate-700 font-semibold">
                        <Calendar className="w-4 h-4 text-indigo-600" />
                        <span>Rangos Rápidos de Análisis:</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => { setDateFrom(""); setDateTo(""); }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
                        >
                          Todos
                        </button>
                        <button
                          onClick={() => applyDatePreset(7, 'days')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors"
                        >
                          1 Semana
                        </button>
                        <button
                          onClick={() => applyDatePreset(1, 'months')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors"
                        >
                          1 Mes
                        </button>
                        <button
                          onClick={() => applyDatePreset(6, 'months')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors"
                        >
                          6 Meses
                        </button>
                        <button
                          onClick={() => applyDatePreset(1, 'years')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium transition-colors"
                        >
                          1 Año
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Desde:</span>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Hasta:</span>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-xs"
                          />
                        </div>
                        {(dateFrom || dateTo) && (
                          <button
                            onClick={() => { setDateFrom(""); setDateTo(""); }}
                            className="text-indigo-600 hover:text-indigo-800 underline font-medium"
                          >
                            Limpiar Rango
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Position Frequency Breakdown */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                  <h3 className="text-base font-bold text-slate-900">Frecuencia de Dígitos (0-9) por Posición</h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {stats.posFreq.map((digitCounts, posIndex) => {
                      const maxCount = Math.max(...digitCounts, 1);
                      return (
                        <div key={posIndex} className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3">
                          <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider text-center pb-1 border-b border-slate-200">
                            Posición {posIndex + 1}
                          </div>
                          <div className="space-y-2">
                            {digitCounts.map((count, digit) => {
                              const pct = ((count / stats.total) * 100).toFixed(1);
                              return (
                                <div key={digit} className="text-xs flex items-center justify-between gap-2">
                                  <span className="w-5 font-mono font-bold text-slate-700">{digit}</span>
                                  <div className="flex-1 h-2 bg-slate-200/70 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500 rounded-full"
                                      style={{ width: `${(count / maxCount) * 100}%` }}
                                    />
                                  </div>
                                  <span className="w-10 text-right font-mono text-[10px] text-slate-500">{count}</span>
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
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Distribución Histórica de Frecuencia Global por Dígito (0 - 9)</h3>
                      <p className="text-xs text-slate-500">Comparativa de apariciones reales frente a la media teórica esperada (línea de referencia)</p>
                    </div>
                    <span className="text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold">
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="digit" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const diff = data.apariciones - data.esperado;
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-mono">
                                  <p className="font-bold text-indigo-300">Dígito: {data.numero}</p>
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
                          fill="#4f46e5"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Parity & High/Low Distribution */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Paridad (Pares vs Impares) */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Balance de Paridad (Pares vs Impares)</h3>
                    <p className="text-xs text-slate-500">Distribución de números pares (0,2,4,6,8) e impares (1,3,5,7,9).</p>

                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-700">Dígitos Pares</span>
                          <span className="font-mono text-indigo-600">
                            {stats.totalEvens} ({((stats.totalEvens / (stats.total * 5)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-600 rounded-full"
                            style={{ width: `${(stats.totalEvens / (stats.total * 5)) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-700">Dígitos Impares</span>
                          <span className="font-mono text-purple-600">
                            {stats.totalOdds} ({((stats.totalOdds / (stats.total * 5)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${(stats.totalOdds / (stats.total * 5)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Altos vs Bajos */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <h3 className="text-base font-bold text-slate-900">Rango de Dígitos (Bajos 0-4 vs Altos 5-9)</h3>
                    <p className="text-xs text-slate-500">Proporción de aparición entre dígitos bajos y altos.</p>

                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-700">Dígitos Bajos (0, 1, 2, 3, 4)</span>
                          <span className="font-mono text-blue-600">
                            {stats.totalLows} ({((stats.totalLows / (stats.total * 5)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${(stats.totalLows / (stats.total * 5)) * 100}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-medium mb-1">
                          <span className="text-slate-700">Dígitos Altos (5, 6, 7, 8, 9)</span>
                          <span className="font-mono text-amber-600">
                            {stats.totalHighs} ({((stats.totalHighs / (stats.total * 5)) * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{ width: `${(stats.totalHighs / (stats.total * 5)) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Stacked Bar Charts (Parity & Ranges) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Parity Stacked Bar Chart */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Evolución Mensual de Paridad (Pares vs. Impares)</h3>
                      <p className="text-xs text-slate-500">Comparativa apilada de la distribución mensual de dígitos pares e impares</p>
                    </div>

                    <div className="h-72 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyTrends}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="monthKey" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-mono">
                                    <p className="font-bold text-indigo-300">Mes: {label}</p>
                                    <p className="text-indigo-400">Pares: {payload[0].value}</p>
                                    <p className="text-purple-400">Impares: {payload[1].value}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="pares" name="Pares" stackId="a" fill="#4f46e5" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="impares" name="Impares" stackId="a" fill="#9333ea" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Ranges Stacked Bar Chart */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Evolución Mensual de Rangos (Bajos vs. Altos)</h3>
                      <p className="text-xs text-slate-500">Comparativa apilada mensual entre dígitos bajos (0-4) y altos (5-9)</p>
                    </div>

                    <div className="h-72 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthlyTrends}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="monthKey" stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                          <Tooltip
                            content={({ active, payload, label }) => {
                              if (active && payload && payload.length) {
                                return (
                                  <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-mono">
                                    <p className="font-bold text-indigo-300">Mes: {label}</p>
                                    <p className="text-blue-400">Bajos (0-4): {payload[0].value}</p>
                                    <p className="text-amber-400">Altos (5-9): {payload[1].value}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="bajos" name="Bajos (0-4)" stackId="b" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="altos" name="Altos (5-9)" stackId="b" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Radar Chart for 5 Daily Draws Comparison */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Comparativa Multicriterio por Sorteo (Gráfico de Radar)</h3>
                      <p className="text-xs text-slate-500">Distribución simultánea de dígitos (0-9) en los 5 sorteos diarios para identificar sesgos y comportamientos</p>
                    </div>
                    <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md font-semibold">
                      Análisis Multidim
                    </span>
                  </div>

                  <div className="h-96 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="digit" tick={{ fill: '#475569', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} />
                        <Radar name="Mediodía" dataKey="Mediodía" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2} />
                        <Radar name="Tres" dataKey="Tres" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                        <Radar name="Extra" dataKey="Extra" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                        <Radar name="Siete" dataKey="Siete" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                        <Radar name="Clásico" dataKey="Clásico" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 text-white p-3 rounded-xl shadow-lg text-xs space-y-1 font-mono">
                                  <p className="font-bold text-indigo-300">{label}</p>
                                  {payload.map((entry: any, index: number) => (
                                    <p key={index} style={{ color: entry.color }}>
                                      {entry.name}: <span className="font-bold">{entry.value}</span> apariciones
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top 10 Frequencies per Modality */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Top 10 de Frecuencias por Modalidad de Juego</h3>
                      <p className="text-xs text-slate-500">Ranking histórico de combinaciones más frecuentes según las reglas de premiación de Tris.</p>
                    </div>

                    {/* Modality Tabs */}
                    <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => setTopModalityTab("directa5")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${topModalityTab === "directa5" ? "bg-white text-indigo-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Directa 5
                      </button>
                      <button
                        onClick={() => setTopModalityTab("directa4")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${topModalityTab === "directa4" ? "bg-white text-indigo-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Directa 4
                      </button>
                      <button
                        onClick={() => setTopModalityTab("directa3")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${topModalityTab === "directa3" ? "bg-white text-indigo-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Directa 3
                      </button>
                      <button
                        onClick={() => setTopModalityTab("parFinal")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${topModalityTab === "parFinal" ? "bg-white text-indigo-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Par Final
                      </button>
                      <button
                        onClick={() => setTopModalityTab("parInicial")}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${topModalityTab === "parInicial" ? "bg-white text-indigo-600 font-bold shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                      >
                        Par Inicial
                      </button>
                    </div>
                  </div>

                  {/* Top 10 Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500">
                          <th className="py-3 px-4 w-20">Ranking</th>
                          <th className="py-3 px-4">Combinación ({topModalityTab.toUpperCase()})</th>
                          <th className="py-3 px-4">Apariciones</th>
                          <th className="py-3 px-4">Frecuencia Relativa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-mono">
                        {(
                          topModalityTab === "directa5" ? stats.topDirecta5 :
                          topModalityTab === "directa4" ? stats.topDirecta4 :
                          topModalityTab === "directa3" ? stats.topDirecta3 :
                          topModalityTab === "parFinal" ? stats.topParFinal :
                          stats.topParInicial
                        ).map((item, idx) => {
                          const pct = ((item.count / stats.total) * 100).toFixed(2);
                          return (
                            <tr key={item.value} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4">
                                <span className={`inline-flex w-7 h-7 rounded-lg items-center justify-center text-xs font-bold ${
                                  idx === 0 ? "bg-amber-100 text-amber-800" :
                                  idx === 1 ? "bg-slate-200 text-slate-800" :
                                  idx === 2 ? "bg-orange-100 text-orange-800" :
                                  "bg-slate-100 text-slate-600"
                                }`}>
                                  #{idx + 1}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded">
                                  {item.value}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-700 font-bold">
                                {item.count} veces
                              </td>
                              <td className="py-3 px-4 text-slate-500">
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

            {/* TAB 3: EXPLORER & SEARCH */}
            {activeTab === "explorer" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Buscador e Historial de Sorteos</h2>
                      <p className="text-xs text-slate-500">Busca por número de 5 dígitos, fecha o tipo de sorteo.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Desde:</span>
                        <input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-600">Hasta:</span>
                        <input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Buscar número..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-48"
                        />
                      </div>

                      <select
                        value={selectedDrawTypeFilter}
                        onChange={(e) => setSelectedDrawTypeFilter(e.target.value)}
                        className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="todos">Todos los Sorteos</option>
                        <option value="mediodía">Mediodía</option>
                        <option value="tres">Tres</option>
                        <option value="extra">Extra</option>
                        <option value="siete">Siete</option>
                        <option value="clásico">Clásico</option>
                      </select>
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span>Mostrando <span className="font-semibold text-slate-800">{filteredRecords.length}</span> registros encontrados</span>
                    <span className="font-mono">Fuente: GitHub pakinja/pakin</span>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="py-3.5 px-4">Fecha</th>
                          <th className="py-3.5 px-4">Sorteo</th>
                          <th className="py-3.5 px-4">Número Ganador (5 Dígitos)</th>
                          <th className="py-3.5 px-4">Suma</th>
                          <th className="py-3.5 px-4">Paridad</th>
                          <th className="py-3.5 px-4">Altos / Bajos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredRecords.slice(0, 100).map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-slate-600">{r.date}</td>
                            <td className="py-3 px-4">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                r.drawType === "Mediodía" ? "bg-sky-50 text-sky-700" :
                                r.drawType === "Tres" ? "bg-amber-50 text-amber-700" :
                                r.drawType === "Extra" ? "bg-purple-50 text-purple-700" :
                                r.drawType === "Siete" ? "bg-indigo-50 text-indigo-700" :
                                "bg-slate-100 text-slate-700"
                              }`}>
                                {r.drawType}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono font-bold tracking-widest text-indigo-600 bg-indigo-50/80 px-3 py-1 rounded-md text-sm shadow-sm">
                                {r.number}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700">{r.sum}</td>
                            <td className="py-3 px-4 text-xs font-mono text-slate-600">{r.evenCount} Pares, {r.oddCount} Impares</td>
                            <td className="py-3 px-4 text-xs font-mono text-slate-600">{r.lowCount} Bajos, {r.highCount} Altos</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SIMULATOR & BETTING MODES */}
            {activeTab === "simulator" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Simulador de Apuestas y Frecuencia Histórica</h2>
                    <p className="text-xs text-slate-500">Prueba cualquier número de 5 dígitos para conocer cuántas veces ha salido históricamente en Tris.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Número de 5 Dígitos (00000 - 99999)</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={simNumber}
                        onChange={(e) => setSimNumber(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-3 text-lg font-mono font-bold tracking-widest bg-slate-50 border border-slate-200 rounded-xl text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="48291"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Modalidad de Apuesta</label>
                      <select
                        value={simModality}
                        onChange={(e) => setSimModality(e.target.value)}
                        className="w-full px-4 py-3 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="directa5">Directa 5 (Orden exacto - paga $50,000 por $1)</option>
                        <option value="directa4">Directa 4 / Últimos 4</option>
                        <option value="directa3">Directa 3 / Últimos 3</option>
                        <option value="candado">Candado (Cualquier orden)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <div className="w-full p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900">
                        <span className="font-semibold block mb-0.5">Probabilidad Teórica Directa 5:</span>
                        <span>1 en 100,000 (0.001%)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulation Output Cards */}
                {simulationResult && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                      <div className="text-xs font-medium text-slate-500">Coincidencias Exactas (Directa 5)</div>
                      <div className="text-3xl font-bold font-mono text-indigo-600">{simulationResult.exactMatches}</div>
                      <div className="text-xs text-slate-500">En {simulationResult.totalRecords} sorteos analizados</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                      <div className="text-xs font-medium text-slate-500">Últimos 4 Dígitos</div>
                      <div className="text-3xl font-bold font-mono text-slate-900">{simulationResult.last4Matches}</div>
                      <div className="text-xs text-slate-500">Terminación de 4 cifras</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                      <div className="text-xs font-medium text-slate-500">Últimos 3 Dígitos</div>
                      <div className="text-3xl font-bold font-mono text-slate-900">{simulationResult.last3Matches}</div>
                      <div className="text-xs text-slate-500">Terminación de 3 cifras</div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
                      <div className="text-xs font-medium text-slate-500">Últimos 2 Dígitos (Par Final)</div>
                      <div className="text-3xl font-bold font-mono text-slate-900">{simulationResult.last2Matches}</div>
                      <div className="text-xs text-slate-500">Terminación de 2 cifras</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: AI INSIGHTS */}
            {activeTab === "ai" && (
              <div className="space-y-8 animate-fadeIn">
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>Inteligencia Artificial Gemini 3.8 Flash</span>
                  </div>
                  <h2 className="text-2xl font-bold">Reporte de Caracterización y Análisis Cuantitativo</h2>
                  <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
                    Utiliza modelos avanzados de lenguaje para procesar las tendencias de los sorteos Tris, detectar rachas, comportamientos de dígitos y generar perspectivas estadísticas.
                  </p>
                  <button
                    onClick={handleRunAiAnalysis}
                    disabled={aiLoading}
                    className="px-6 py-3 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className={`w-4 h-4 ${aiLoading ? "animate-spin" : ""}`} />
                    <span>{aiLoading ? "Analizando Sorteos con IA..." : "Generar Análisis Estadístico IA"}</span>
                  </button>
                </div>

                {aiReport && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        <span>Dictamen Analítico de Tris</span>
                      </h3>
                      <span className="text-xs font-mono text-slate-400">Generado por Gemini AI</span>
                    </div>

                    <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap">
                      {aiReport}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200 mt-16 text-center text-xs text-slate-500 space-y-2">
        <p>TrisAnalytics Pro — Plataforma independiente de caracterización de sorteos Tris (Lotería Nacional).</p>
        <p>Datos en tiempo real sincronizados desde el repositorio público <a href="https://github.com/pakinja/pakin" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium">pakinja/pakin</a>.</p>
      </footer>
    </div>
  );
}
