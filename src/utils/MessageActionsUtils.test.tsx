/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { canPerformAction } from './MessageActionsUtils';
import { createMockTextMessage } from '../tests/createMock';
import { messageActionType } from '../types/store/ActiveConversationTypes';

describe('messageActionsUtils function', () => {
	test('edit action can be performed', () => {
		const simpleMessage = createMockTextMessage();
		const result = canPerformAction(simpleMessage, true, 123456789, messageActionType.EDIT);
		expect(result).toBeTruthy();
	});
	test('edit action can not be performed due to time span', () => {
		const simpleMessage = createMockTextMessage();
		const result = canPerformAction(simpleMessage, true, 1, messageActionType.EDIT);
		expect(result).not.toBeTruthy();
	});
	test('edit action can not be performed due to the fact that the message is not mine', () => {
		const simpleMessage = createMockTextMessage();
		const result = canPerformAction(simpleMessage, false, 123456789, messageActionType.EDIT);
		expect(result).not.toBeTruthy();
	});
	test('edit action can not be performed due to forwarded message', () => {
		const simpleMessage = createMockTextMessage({ forwarded: true });
		const result = canPerformAction(simpleMessage, true, 123456789, messageActionType.EDIT);
		expect(result).not.toBeTruthy();
	});

	test('delete action can be performed', () => {
		const simpleMessage = createMockTextMessage();
		const result = canPerformAction(simpleMessage, true, 123456789);
		expect(result).toBeTruthy();
	});
	test('delete action can not be performed due to time span', () => {
		const simpleMessage = createMockTextMessage();
		const result = canPerformAction(simpleMessage, true, 1);
		expect(result).not.toBeTruthy();
	});
	test('delete action can not be performed due to the fact that the message is not mine', () => {
		const simpleMessage = createMockTextMessage();
		const result = canPerformAction(simpleMessage, false, 123456789);
		expect(result).not.toBeTruthy();
	});
});
