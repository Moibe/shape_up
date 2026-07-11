import type { Appetite } from './db/schema';

// Per-pitch clock. Build length follows the appetite; cooldown is a third of the
// build (big → 2 weeks, matching classic Shape Up; small → ~5 days). Tweak here.
export function buildDays(appetite: Appetite): number {
	return appetite === 'small' ? 14 : 42;
}
export function cooldownDays(appetite: Appetite): number {
	return Math.round(buildDays(appetite) / 3);
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
function addDays(startIso: string, n: number): string {
	const d = new Date(`${startIso}T00:00:00`);
	d.setDate(d.getDate() + n);
	return iso(d);
}
export function todayIso(): string {
	return iso(new Date());
}

// Derive the persisted dates when a pitch starts building.
export function derivePitchDates(startIso: string, appetite: Appetite) {
	const buildEndDate = addDays(startIso, buildDays(appetite));
	const cooldownEndDate = addDays(buildEndDate, cooldownDays(appetite));
	return { buildStartDate: startIso, buildEndDate, cooldownEndDate };
}

export type PitchPhase = 'building' | 'cooldown' | 'ended';

// The current phase + days left is DERIVED from the pitch's dates vs today — the
// dates are sacred, the phase follows them automatically (no manual flip).
export function pitchClock(
	p: { buildEndDate: string | null; cooldownEndDate: string | null },
	today = todayIso()
): { phase: PitchPhase; daysLeft: number } | null {
	if (!p.buildEndDate) return null;
	const diff = (target: string) =>
		Math.round(
			(new Date(`${target}T00:00:00`).getTime() - new Date(`${today}T00:00:00`).getTime()) /
				86_400_000
		);
	if (today <= p.buildEndDate) return { phase: 'building', daysLeft: diff(p.buildEndDate) };
	if (p.cooldownEndDate && today <= p.cooldownEndDate)
		return { phase: 'cooldown', daysLeft: diff(p.cooldownEndDate) };
	return { phase: 'ended', daysLeft: 0 };
}
