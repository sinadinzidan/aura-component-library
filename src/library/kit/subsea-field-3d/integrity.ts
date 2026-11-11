import type { Tone } from '../tones';

/**
 * The integrity picture of a subsea asset and the questions a screen asks of it: how bad is the
 * worst finding, which asset needs attention first, and how the whole field is doing. Pure.
 */

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low';

export type IntegrityFinding = { text: string; severity: FindingSeverity; foundDaysAgo: number };

export type IntegrityRecord = {
  /** Operating pressure in bar. */
  pressure: number;
  /** Operating temperature in °C. */
  temperature: number;
  inspectedDaysAgo: number;
  /** Remaining design life in years. */
  remainingLife: number;
  findings: readonly IntegrityFinding[];
};

export const SEVERITY_ORDER: readonly FindingSeverity[] = ['critical', 'high', 'medium', 'low'];

export const SEVERITY_LABEL: Readonly<Record<FindingSeverity, string>> = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

export const SEVERITY_TONE: Readonly<Record<FindingSeverity, Tone>> = { critical: 'critical', high: 'critical', medium: 'warning', low: 'info' };

const SEVERITY_WEIGHT: Readonly<Record<FindingSeverity, number>> = { critical: 40, high: 22, medium: 9, low: 3 };

/** Design life the remaining-life ring is drawn against, in years. */
export const DESIGN_LIFE_YEARS = 30;

/** Remaining life below this many years is called out. */
export const SHORT_LIFE_YEARS = 12;

/** The most severe open finding, or `null` when the asset has none. */
export function worstSeverity(record: IntegrityRecord): FindingSeverity | null {
  return SEVERITY_ORDER.find((severity) => record.findings.some((finding) => finding.severity === severity)) ?? null;
}

/** The tone an asset is drawn in: its worst finding, else a warning for short life, else success. */
export function integrityTone(record: IntegrityRecord): Tone {
  const worst = worstSeverity(record);
  if (worst === 'critical' || worst === 'high') return 'critical';
  if (worst === 'medium' || record.remainingLife < SHORT_LIFE_YEARS) return 'warning';
  return worst === 'low' ? 'info' : 'success';
}

/** One line on the state of an asset: "2 open findings, worst high" or "No open findings". */
export function integritySummary(record: IntegrityRecord): string {
  const worst = worstSeverity(record);
  if (!worst) return 'No open findings';
  const count = record.findings.length;
  return `${count} open ${count === 1 ? 'finding' : 'findings'}, worst ${SEVERITY_LABEL[worst].toLowerCase()}`;
}

/** Higher means look at it sooner: findings by severity, plus the design life already used up. */
export function riskScore(record: IntegrityRecord): number {
  const findings = record.findings.reduce((sum, finding) => sum + SEVERITY_WEIGHT[finding.severity], 0);
  const life = Math.max(0, DESIGN_LIFE_YEARS - record.remainingLife);
  return findings + life;
}

/** Ids ordered by risk, highest first; ties keep the order given. */
export function rankByRisk(records: Readonly<Record<string, IntegrityRecord>>, ids: readonly string[]): string[] {
  return ids
    .map((id, index) => ({ id, index, score: records[id] ? riskScore(records[id]) : -1 }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.id);
}

/** Open findings in the whole field per severity, in severity order. */
export function findingsBySeverity(records: readonly IntegrityRecord[]): { severity: FindingSeverity; count: number }[] {
  return SEVERITY_ORDER.map((severity) => ({ severity, count: records.reduce((sum, record) => sum + record.findings.filter((finding) => finding.severity === severity).length, 0) }));
}

/** A 0–100 index for the field: 100 with no findings, falling with every finding by its severity. */
export function fieldIntegrityIndex(records: readonly IntegrityRecord[]): number {
  if (records.length === 0) return 100;
  const penalty = records.reduce((sum, record) => sum + record.findings.reduce((inner, finding) => inner + SEVERITY_WEIGHT[finding.severity], 0), 0);
  return Math.max(0, Math.round(100 - penalty / records.length));
}
