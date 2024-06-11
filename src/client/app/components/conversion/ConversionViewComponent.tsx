/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
// Realize that * is already imported from react
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { selectConversionById } from '../../redux/api/conversionsApi';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { useAdminEditModalHook } from '../../redux/componentHooks';
import { useAppSelector } from '../../redux/reduxHooks';
import { EntityType, selectEntityDisplayData } from '../../redux/slices/localEditsSlice';
import { RootState } from '../../store';
import '../../styles/card-page.css';
import { conversionArrow } from '../../utils/conversionArrow';
import translate from '../../utils/translate';

interface ConversionViewComponentProps {
	// Not a real id, but synthetic for useWith entityAdapter.
	id: number;
}
export const selectConversionHeader = (state: RootState, id: number) => {
	const unitDataById = selectUnitDataById(state);
	const conversionData = selectConversionById(state, id);
	const header = String(unitDataById[conversionData.sourceId]?.identifier + conversionArrow(conversionData.bidirectional) +
		unitDataById[conversionData.destinationId]?.identifier);
	return header;
};
/**
 * Defines the conversion info card
 * @param props defined above
 * @returns Single conversion element
 */
export default function ConversionViewComponent(props: ConversionViewComponentProps) {
	// Don't check if admin since only an admin is allow to route to this page.

	// Edit Modal Show
	const unitDataById = useAppSelector(selectUnitDataById);
	const [conversionData, unsavedChanges] = useAppSelector(state => selectEntityDisplayData(state, { type: EntityType.CONVERSION, id: props.id }));

	const { openAdminEditModal } = useAdminEditModalHook({ type: EntityType.CONVERSION, id: props.id });
	// Create header from sourceId, destinationId identifiers
	const header = useAppSelector(state => selectConversionHeader(state, props.id));

	// Unlike the details component, we don't check if units are loaded since must come through that page.

	return (
		<div className="card">
			<div className="identifier-container">
				{`${header}:${unsavedChanges ? ' (Unsaved Edits)' : ''}`}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.source" /></b> {unitDataById[conversionData.sourceId]?.identifier}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.destination" /></b> {unitDataById[conversionData.destinationId]?.identifier}
			</div>
			<div className={conversionData.bidirectional.toString()}>
				<b><FormattedMessage id="conversion.bidirectional" /></b> {translate(`TrueFalseType.${conversionData.bidirectional.toString()}`)}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.slope" /></b> {conversionData.slope}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="conversion.intercept" /></b> {conversionData.intercept}
			</div>
			<div className="item-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
				<b><FormattedMessage id="note" /></b> {conversionData.note.slice(0, 29)}
			</div>
			<div className="edit-btn">
				{/* Triggers global Admin Modal to open */}
				<Button color='secondary' onClick={openAdminEditModal}>
					<FormattedMessage id="conversion.edit.conversion" />
				</Button>
			</div>
		</div>
	);
}
