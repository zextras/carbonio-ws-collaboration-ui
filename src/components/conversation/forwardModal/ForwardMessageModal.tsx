/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import {
	Button,
	ChipInput,
	Container,
	List,
	Modal,
	Padding,
	Text,
	Tooltip
} from '@zextras/carbonio-design-system';
import {
	difference,
	differenceBy,
	find,
	forEach,
	keyBy,
	map,
	mapValues,
	omit,
	size,
	union
} from 'lodash';
import React, {
	FunctionComponent,
	ReactElement,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import ForwardMessageConversationChip from './ForwardMessageConversationChip';
import ForwardMessageConversationListItem from './ForwardMessageConversationListItem';
import { RoomsApi } from '../../../network';
import { getXmppClient } from '../../../store/selectors/ConnectionSelector';
import { getRoomIdsOrderedLastMessage } from '../../../store/selectors/MessagesSelectors';
import { getRoomNameSelector } from '../../../store/selectors/RoomsSelectors';
import useStore from '../../../store/Store';
import { TextMessage } from '../../../types/store/MessageTypes';

const CustomContainer = styled(Container)`
	cursor: default;
`;

type ForwardMessageModalProps = {
	open: boolean;
	onClose: () => void;
	roomId: string;
	message: TextMessage;
};

const ForwardMessageModal: FunctionComponent<ForwardMessageModalProps> = ({
	open,
	onClose,
	roomId,
	message
}): ReactElement => {
	const roomName = useStore((state) => getRoomNameSelector(state, roomId));
	const rooms = useStore(getRoomIdsOrderedLastMessage);

	const [t] = useTranslation();
	const modalTitle = t('modal.forward.title', `Forward message from ${roomName}`, {
		chatName: roomName
	});
	const modalDescription = t(
		'modal.forward.description',
		'Choose a target chat to forward the message'
	);

	const closeLabel = t('action.close', 'Close');
	const noMatchLabel = t('participantsList.noMatch', 'There are no items that match this search');
	const inputPlaceholder = t('modal.forward.inputPlaceholder', 'Start typing or pick a chat');
	const forwardActionLabel = t('action.forward', 'Forward');
	const chooseOneChatLabel = t('modal.forward.chooseAtLeastOneChat', 'Choose at least one chat');

	const inputRef = useRef<HTMLInputElement>(null);
	const [inputValue, setInputValue] = useState('');
	const [selected, setSelected] = useState<{ [id: string]: boolean }>({});
	const [chatList, setChatList] = useState<{ id: string }[]>([]);
	const [chips, setChips] = useState<{ id: string }[]>([]);

	const xmppClient = useStore(getXmppClient);

	// Update conversation list on filter updating
	useEffect(() => {
		let roomList: { id: string }[];
		if (inputValue === '') {
			roomList = map(rooms, (room) => ({ id: room.roomId }));
		} else {
			roomList = [];
			map(rooms, ({ roomId }) => {
				const roomName = getRoomNameSelector(useStore.getState(), roomId);
				if (roomName.toLocaleLowerCase().includes(inputValue.toLocaleLowerCase())) {
					roomList.push({ id: roomId });
				}
			});
		}
		setChatList(roomList);
	}, [inputValue, rooms]);

	const handleChangeText = useCallback((e) => setInputValue(e.target.value), []);

	const select = useCallback(
		(id) => setSelected((s) => (s[id] ? omit(s, id) : { ...s, [id]: true })),
		[]
	);

	const onClickListItem = useCallback(
		(roomId: string) => () => {
			select(roomId);
			setChips((chips) =>
				find(chips, (chip) => chip.id === roomId)
					? differenceBy(chips, [{ id: roomId }], 'id')
					: union(chips, [{ id: roomId }])
			);

			if (inputRef.current) {
				inputRef.current.value = '';
				setInputValue('');
			}
		},
		[select]
	);

	const removeContactFromChip = useCallback(
		(newArrayChips: { id: string }[]) => {
			setSelected(mapValues(keyBy(newArrayChips, 'id'), () => true));
			const differenceChip = difference(chips, newArrayChips)[0];
			if (size(chips) > size(newArrayChips) && differenceChip) {
				setChips((chips) => differenceBy(chips, [differenceChip], 'id'));
			}
		},
		[chips]
	);

	const forwardMessage = useCallback(() => {
		const isMyMessage = message.from === useStore.getState().session.id;
		if (isMyMessage && !message.attachment) {
			forEach(selected, (value, key) => xmppClient.sendChatMessage(key, message.text));
		} else {
			Promise.all(map(selected, (value, key) => RoomsApi.forwardMessages(key, [message])))
				.then(() => onClose())
				.catch(() => onClose());
		}
	}, [message, onClose, selected, xmppClient]);

	const ListItem = useMemo(
		() =>
			// eslint-disable-next-line react/display-name
			({ item, selected }: any) =>
				(
					<ForwardMessageConversationListItem
						roomId={item.id}
						selected={selected}
						onClick={onClickListItem}
					/>
				),
		[onClickListItem]
	);

	const disabledForwardButton = useMemo(() => size(selected) === 0, [selected]);

	const modalFooter = useMemo(
		() => (
			<Tooltip
				label={disabledForwardButton ? chooseOneChatLabel : forwardActionLabel}
				placement="right"
			>
				<Container crossAlignment="flex-end">
					<Button
						label={forwardActionLabel}
						onClick={forwardMessage}
						disabled={disabledForwardButton}
						data-testid="forward_button"
					/>
				</Container>
			</Tooltip>
		),
		[chooseOneChatLabel, disabledForwardButton, forwardActionLabel, forwardMessage]
	);

	return (
		<Modal
			open={open}
			title={modalTitle}
			showCloseIcon
			onClose={onClose}
			size="small"
			customFooter={modalFooter}
			closeIconTooltip={closeLabel}
		>
			<Text overflow="break-word" size="small">
				{modalDescription}
			</Text>
			<Padding bottom="large" />
			<ChipInput
				data-testid="chip_input_forward_modal"
				inputRef={inputRef}
				background={'gray5'}
				placeholder={inputPlaceholder}
				onInputType={handleChangeText}
				value={chips}
				onChange={removeContactFromChip}
				requireUniqueChips
				ChipComponent={ForwardMessageConversationChip}
				confirmChipOnBlur={false}
				confirmChipOnSpace={false}
				separators={['']}
			/>
			<Padding bottom="large" />
			<Container height="9.375rem">
				{size(chatList) === 0 ? (
					<CustomContainer padding="large">
						<Text color="gray1" size="small" weight="light">
							{noMatchLabel}
						</Text>
					</CustomContainer>
				) : (
					<List
						data-testid="list_forward_modal"
						items={chatList}
						ItemComponent={ListItem}
						selected={selected}
					/>
				)}
			</Container>
		</Modal>
	);
};

export default ForwardMessageModal;
