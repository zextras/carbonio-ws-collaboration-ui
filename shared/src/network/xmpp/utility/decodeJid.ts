/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Strophe } from 'strophe.js';

export const domain = 'carbonio';
export const MUCservice = 'muclight.carbonio';

export const carbonize = (id: string): string => `${id}@${domain}`;

export const carbonizeMUC = (id: string): string => `${id}@${MUCservice}`;

// a@b.com/c@d.com --> a
export const getId = (jid: string): string => Strophe.getNodeFromJid(jid);

// a@b.com/c@d.com --> b.com
export const getDomain = (jid: string): string => Strophe.getDomainFromJid(jid);

// a@b.com/c@d.com --> a@b.com
export const getFullId = (jid: string): string => Strophe.getBareJidFromJid(jid);

// a@b.com/c@d.com --> c@d.com
export const getResource = (jid: string): string => Strophe.getResourceFromJid(jid);
