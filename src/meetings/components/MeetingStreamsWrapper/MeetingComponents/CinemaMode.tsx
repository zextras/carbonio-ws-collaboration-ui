/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Container } from '@zextras/carbonio-design-system';
import React, { ReactElement, useRef } from 'react';
import styled from 'styled-components';

import StreamsCarousel from './StreamsCarousel';

// const MyStream = styled(Container)`
// 	position: absolute;
// 	top: 0;
// 	right: 0;
// `;

const CinemaModeWrapper = styled(Container)`
	position: relative;
`;

const MainStreamWrapper = styled(Container)`
	//margin: ${({ theme }): string => theme.sizes.padding.small};
`;
const MainStream = styled(Container)`
	height: ${({ h }): string => h}px;
	width: ${({ w }): string => w}px;
`;

const CinemaMode = (): ReactElement => {
	// const { meetingId }: Record<string, string> = useParams();
	// const sidebarStatus: boolean | undefined = useStore((store) =>
	// 	getSidebarStatus(store, meetingId)
	// );

	// const [mainStreamHeight, setMainStreamHeight] = useState(0);
	// const [mainStreamWidth, setMainStreamWidth] = useState(0);
	const mainStreamRef = useRef<HTMLDivElement>(null);

	// const calcMainStreamSize = useCallback(() => {
	// 	if (mainStreamRef && mainStreamRef.current) {
	// 		let idealHeight;
	// 		let idealWidth;
	// 		idealHeight = (mainStreamRef.current.offsetWidth / 16) * 9;
	// 		idealWidth = mainStreamRef.current.offsetWidth;
	// 		if (idealHeight > mainStreamRef.current.offsetHeight) {
	// 			idealHeight = mainStreamRef.current.offsetHeight;
	// 			idealWidth = (mainStreamRef.current.offsetHeight / 9) * 16;
	// 		}
	// 		setMainStreamHeight(idealHeight);
	// 		setMainStreamWidth(idealWidth);
	// 	}
	// }, [mainStreamRef]);

	// useEffect(() => {
	// 	calcMainStreamSize();
	// 	if (mainStreamRef !== null && mainStreamRef.current) {
	// 		mainStreamRef.current.addEventListener('resize', calcMainStreamSize);
	// 	}
	// 	return () => {
	// 		if (mainStreamRef !== null && mainStreamRef.current) {
	// 			mainStreamRef.current.removeEventListener('resize', calcMainStreamSize);
	// 		}
	// 	};
	// }, [calcMainStreamSize, sidebarStatus, mainStreamRef]);

	return (
		<CinemaModeWrapper data-testid="cinemaModeView" orientation="horizontal">
			{/* CINEMA 1TO1 */}
			{/* <MyStream height="144px" width="256px" background="secondary" /> */}
			{/* <MainStreamWrapper ref={mainStreamRef} width="fill" height="fill" background="primary"> */}
			{/*	<MainStream h={mainStreamHeight} w={mainStreamWidth} background="success" /> */}
			{/* </MainStreamWrapper> */}
			{/* CINEMA MORE STREAM */}
			<MainStreamWrapper ref={mainStreamRef} width="fill" height="fill" /* background="primary" */>
				<MainStream /* background="success" */ />
			</MainStreamWrapper>
			<StreamsCarousel />
		</CinemaModeWrapper>
	);
};

export default CinemaMode;
