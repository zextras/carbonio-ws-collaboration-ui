/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TOP_RUNG } from './inboundQualityController';
import { SimulcastTier } from '../../types/store/SessionTypes';

// Simulcast tier name -> inbound substream rung (0 = 144p, 1 = 360p, 2 = 720p).
const TIER_NAME_TO_RUNG: Record<SimulcastTier['name'], number> = { low: 0, medium: 1, high: 2 };

// Smallest simulcast tier whose height covers the tile's PHYSICAL pixel height (renderedHeightPx * dpr),
// expressed as a rung. No tiers configured -> TOP_RUNG (no cap), mirroring the outbound defensive fallback.
// A tile taller than every tier gets the tallest tier's rung.
export function ceilingRungForHeight(
	renderedHeightPx: number,
	devicePixelRatio: number,
	tiers: SimulcastTier[] | undefined
): number {
	if (!tiers || tiers.length === 0) return TOP_RUNG;
	const neededPx = renderedHeightPx * (devicePixelRatio || 1);
	const ascending = [...tiers].sort((a, b) => a.height - b.height);
	const covering = ascending.find((t) => t.height >= neededPx) ?? ascending[ascending.length - 1];
	return Math.min(TIER_NAME_TO_RUNG[covering.name] ?? TOP_RUNG, TOP_RUNG);
}
