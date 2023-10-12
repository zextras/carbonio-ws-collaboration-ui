/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useEffect, useMemo, useState } from 'react';

type UsePaginationReturnType = {
	rowIndex: number;
	showPaginationButtons: boolean;
	prevButton: { onClick: () => void; disabled: boolean };
	nextButton: { onClick: () => void; disabled: boolean };
};
const usePagination = (
	totalRows: number,
	pageRows: number,
	desiredStep = 1
): UsePaginationReturnType => {
	const [rowIndex, setRowIndex] = useState(0);

	const step = useMemo(
		() => (totalRows > desiredStep ? desiredStep : totalRows),
		[desiredStep, totalRows]
	);

	const clickPrevButton = useCallback(
		() => setRowIndex((prev) => (prev - step > 0 ? prev - step : 0)),
		[step]
	);

	const clickNextButton = useCallback(
		() =>
			setRowIndex((prev) =>
				prev + step >= totalRows - pageRows ? totalRows - pageRows : prev + step
			),
		[step, pageRows, totalRows]
	);

	const prevButtonDisabled = useMemo(() => rowIndex === 0, [rowIndex]);

	const nextButtonDisabled = useMemo(
		() => rowIndex === totalRows - pageRows,
		[rowIndex, pageRows, totalRows]
	);

	const showPaginationButtons = useMemo(() => {
		if (pageRows === 0) return false;
		return totalRows > pageRows;
	}, [pageRows, totalRows]);

	// Update rowIndex when some tiles are removed and the rowIndex is near the end of the list
	useEffect(() => {
		if (rowIndex >= totalRows - pageRows && totalRows - pageRows >= 0) {
			setRowIndex(totalRows - pageRows);
		}
	}, [pageRows, rowIndex, totalRows]);

	return {
		rowIndex,
		showPaginationButtons,
		prevButton: { onClick: clickPrevButton, disabled: prevButtonDisabled },
		nextButton: { onClick: clickNextButton, disabled: nextButtonDisabled }
	};
};

export default usePagination;
