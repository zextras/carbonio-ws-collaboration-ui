/* eslint-disable */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Avatar, Container, Text, IconButton } from '@zextras/carbonio-design-system';
import { map } from 'lodash';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

const DragAndDropTest = () => {
    const arr = [
        { id: '1', name: 'milan' },
        { id: '2', name: 'juve' },
        { id: '3', name: 'inter' },
        { id: '4', name: 'lazio' },
        { id: '5', name: 'napoli' },
        { id: '6', name: 'genoa' },
        { id: '7', name: 'samp' },
        { id: '8', name: 'venezia' },
        { id: '9', name: 'toro' },
        { id: '10', name: 'sassuolo' },
        { id: '11', name: 'siena' },
        { id: '12', name: 'cremona' },
        { id: '13', name: 'spezia' }
    ];
    
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState('');
    const wrapperRef = useRef();
    const refToReplace = useRef();
    const refToMove = useRef();
    
    const dragEventEnterHandler = (ref, positionToPlace) => {
        setIsDragging(true);
        setPosition(positionToPlace);
        refToReplace.current = ref;
    };
    
    const handleMouseDropOutsideDropzone = () => {
        setIsDragging(false);
        window.removeEventListener('mousemove', handleMouseDropOutsideDropzone);
    };
    
    const dragEventStartHandler = (ref) => {
        refToMove.current = ref;
        // handle mouseoutofdropzone
        window.addEventListener('mousemove', handleMouseDropOutsideDropzone);
    };
    
    const onDrop = useCallback(() => {
        setIsDragging(false);
        if (position === 'top') {
            wrapperRef.current.insertBefore(refToMove.current, refToReplace.current);
            refToReplace.current.style.border = 'none';
            refToReplace.current.style.paddingTop = '0.5rem';
        } else if (position === 'bottom') {
            wrapperRef.current.insertBefore(refToMove.current, refToReplace.current.nextSibling);
            refToReplace.current.style.border = 'none';
            refToReplace.current.style.paddingBottom = '0.5rem';
        }
    }, [wrapperRef, refToReplace, position, refToMove]);
    
    const listOfItems = useMemo(
        () =>
            map(arr, (team) => (
                <DraggableItem
                    team={team}
                    isDragging={isDragging}
                    dragEventEnterHandler={dragEventEnterHandler}
                    dragEventStartHandler={dragEventStartHandler}
                />
            )),
        [arr, wrapperRef, refToReplace, position, refToMove]
    );
    
    return (
        <Container
            mainAlignment="flex-start"
            onDrop={onDrop}
            ref={wrapperRef}
            padding={{ bottom: 'small' }}
        >
            {listOfItems}
        </Container>
    );
};

export default DragAndDropTest;

const DraggableSidebarItem = styled(Container)`
	&:hover {
		background-color: ${({ theme }): string => theme.palette.highlight.hover};
		cursor: pointer;
	}
	${({ theme, dragBorder, isDragging }) =>
    dragBorder !== '' &&
    isDragging &&
    css`
		border-${dragBorder}: 0.0625rem solid ${theme.palette.primary.regular};
      	padding-${dragBorder}: 1.25rem;
		transition: padding-${dragBorder} 0.2s;
	`}
`;

const DraggableItem = ({ team, isDragging, dragEventEnterHandler, dragEventStartHandler }) => {
    const [borderHint, setBorderHint] = useState('');
    const draggableRef = useRef();
    const timeoutMouseRef = useRef();
    
    const dragEventOverHandler = (e) => {
        e.preventDefault();
    };
    
    const dragEnterHandler = useCallback(
        (e) => {
            e.preventDefault();
            const rect = draggableRef.current.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const refHeight = draggableRef.current.offsetHeight;
            let positionToPlace;
            
            if (refHeight / 2 > y) {
                setBorderHint('top');
                positionToPlace = 'top';
            } else {
                setBorderHint('bottom');
                positionToPlace = 'bottom';
            }
            // console.log(team, y, refHeight, rect.height, positionToPlace);
            dragEventEnterHandler(draggableRef.current, positionToPlace);
        },
        [draggableRef]
    );
    
    const dragLeaveHandler = useCallback(() => {
        setBorderHint('');
    }, []);
    
    const dragStartHandler = useCallback(() => {
        dragEventStartHandler(draggableRef.current);
    }, [draggableRef]);
    
    const handleOnClick = () => console.log('click');
    
    return (
        <DraggableSidebarItem
            orientation="horizontal"
            height="fit"
            borderRadius="none"
            ref={draggableRef}
            draggable
            onClick={handleOnClick}
            isDragging={isDragging}
            dragBorder={borderHint}
            onDragOver={dragEventOverHandler}
            onDragEnter={dragEnterHandler}
            onDragLeave={dragLeaveHandler}
            onDragStart={dragStartHandler}
            padding={{ all: 'small' }}
        >
            <InternalChannelList teamName={team.name} />
        </DraggableSidebarItem>
    );
};

const InternalChannelList = ({ teamName }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const internalList = [
        { id: '1', name: 'vicenza' },
        { id: '2', name: 'treviso' },
        { id: '3', name: 'venezia' },
        { id: '4', name: 'rovigo' },
        { id: '5', name: 'verona' }
    ];
    
    const listInt = useMemo(
        () =>
            map(internalList, (team) => (
                <DraggableItem
                    team={team}
                    isDragging={isDragging}
                    dragEventEnterHandler={dragEventEnterHandler}
                    dragEventStartHandler={dragEventStartHandler}
                />
            )),
        [arr, wrapperRef, refToReplace, position, refToMove]
    );
    
    return isOpen ? (
        <>
            <Avatar label={teamName} title={teamName} shape={'square'} />
            <Container
                crossAlignment="flex-start"
                width={'calc(100% - 2.5rem)'}
                padding={{ left: 'small' }}
            >
                <Text size="small">{teamName}</Text>
            </Container>
            <IconButton
                borderRadius="round"
                size="small"
                icon="ChevronUp"
                onClick={() => setIsOpen(false)}
            />
        </>
    ) : (
        <>
            <Avatar label={teamName} title={teamName} shape={'square'} />
            <Container
                crossAlignment="flex-start"
                width={'calc(100% - 2.5rem)'}
                padding={{ left: 'small' }}
            >
                <Text size="small">{teamName}</Text>
            </Container>
            <IconButton
                borderRadius="round"
                size="small"
                icon="ChevronDown"
                onClick={() => setIsOpen(true)}
            />
        </>
    );
};