/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, {
	Dispatch,
	FC,
	SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState
} from 'react';

import styled from '@emotion/styled';
import { Button, Container, Text } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import { useTranslation } from 'react-i18next';

import CreateVirtualRoomModal from './CreateVirtualRoomModal';
import VirtualRoomCard from './virtualRoomCard/VirtualRoomCard';
import { useTemporaryRoomIdsOrderedByCreation } from '../../../../store/selectors/RoomsSelectors';

type virtualRoomsListProps = {
	setListVisibility: Dispatch<SetStateAction<boolean>>;
	parentRef: React.RefObject<HTMLDivElement>;
};

const CustomContainer = styled(Container)`
	position: fixed;
	width: 21.875rem;
	height: auto;
	max-height: 31.25rem;
	bottom: 3rem;
	left: 3.6rem;
	border-radius: 0.5rem;
	box-shadow: 0 0 4px 0 rgba(166, 166, 166, 0.5);
	z-index: 3;
`;

const ListContainer = styled(Container)`
	overflow-y: auto;
`;

const VirtualRoomsList: FC<virtualRoomsListProps> = ({ setListVisibility, parentRef }) => {
	const [t] = useTranslation();

	const noVirtualRoomsLabel = t(
		'meeting.virtual.emptyState',
		'The Rooms you create will be shown here'
	);

	const createVirtualRoom = t('meeting.virtual.newRoom', 'Create new virtual room');

	const virtualRoomList = useTemporaryRoomIdsOrderedByCreation();

	const [showCreationModal, setShowCreationModal] = useState(false);

	const popupRef = useRef<HTMLDivElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const createModalRef = useRef<HTMLDivElement>(null);

	const handleMouseUp = useCallback(
		(event: MouseEvent) => {
			if (
				modalRef.current?.contains(event.target as Node) ||
				parentRef.current?.contains(event.target as Node) ||
				createModalRef.current?.contains(event.target as Node)
			) {
				setListVisibility(true);
			} else if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
				setListVisibility(false);
			}
		},
		[parentRef, setListVisibility]
	);

	const toggleModal = useCallback(() => {
		setShowCreationModal((prevState) => !prevState);
	}, []);

	const virtualRoomListSection = useMemo(
		() =>
			map(virtualRoomList, (room) => (
				<VirtualRoomCard roomId={room} modalRef={modalRef} key={`listItem-${room}`} />
			)),
		[virtualRoomList]
	);

	const noVirtualRoomSection = useMemo(
		() => (
			<Container padding="1rem">
				<Text color="gray1" size="small" weight="light" overflow="break-word">
					{noVirtualRoomsLabel}
				</Text>
			</Container>
		),
		[noVirtualRoomsLabel]
	);

	const listSection = useMemo(
		() => (virtualRoomList.length !== 0 ? virtualRoomListSection : noVirtualRoomSection),
		[noVirtualRoomSection, virtualRoomList.length, virtualRoomListSection]
	);

	useEffect(() => {
		window.addEventListener('mouseup', handleMouseUp);

		return (): void => {
			window.removeEventListener('mouseup', handleMouseUp);
		};
	}, [handleMouseUp]);

	return (
		<CustomContainer background={'gray6'} height="fit" padding="0.5rem" gap="0.5rem" ref={popupRef}>
			<Button label={createVirtualRoom} color="primary" width="fill" onClick={toggleModal} />
			<CreateVirtualRoomModal
				open={showCreationModal}
				onClose={() => setShowCreationModal(false)}
				createModalRef={createModalRef}
			/>
			<ListContainer gap="0.5rem" mainAlignment="flex-start">
				{listSection}
			</ListContainer>
		</CustomContainer>
	);
};

export default VirtualRoomsList;
