/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TIER_RUNG } from './connectionQualityScore';
import { TOP_RUNG } from './inboundQualityController';
import { SimulcastTier } from '../../types/store/SessionTypes';

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
	const covering = ascending.find((t) => t.height >= neededPx) ?? ascending.at(-1);
	if (!covering) return TOP_RUNG;
	return Math.min(TIER_RUNG[covering.name] ?? TOP_RUNG, TOP_RUNG);
}
