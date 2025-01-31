/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { MeetingRoutesParams } from '../../../hooks/useRouting';
import useTilesOrder from '../../../hooks/useTilesOrder';

const Container = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	background-color: #f0f0f0; /* Colore di sfondo per il div */
`;

// Stile per il paragrafo
const BoldRedText = styled.p`
	font-weight: bold;
	color: red;
	font-size: 24px; /* Dimensione del testo */
`;

const PictureInPictureView = () => {
	const { meetingId }: MeetingRoutesParams = useParams();

	const { centralTile } = useTilesOrder(meetingId);

	return (
		<div style={{ backgroundColor: '#f0f0f0' }}>
			<p style={{ color: 'red' }}>borraccia</p>
		</div>
	);
};

export default PictureInPictureView;
