/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { RootStore } from '../../types/store/StoreTypes';

export const getMeetingActionsAccordionStatus = (store: RootStore, meetingId: string): boolean =>
	store.activeMeeting[meetingId]?.sidebarStatus?.actionsAccordionIsOpened || true;

export const getMeetingParticipantsAccordionStatus = (
	store: RootStore,
	meetingId: string
): boolean => store.activeMeeting[meetingId]?.sidebarStatus?.participantsAccordionIsOpened || false;

export const getLocalVideoSteam = (store: RootStore, meetingId: string): MediaStream | undefined =>
	store.activeMeeting[meetingId]?.localStreams?.video || undefined;
