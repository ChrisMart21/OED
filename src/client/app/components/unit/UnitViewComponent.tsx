/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
//Realize that * is already imported from react
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { useAdminEditModalHook } from '../../redux/componentHooks';
import { LocaleDataKey } from 'translations/data';
import { useAppSelector } from '../../redux/reduxHooks';
import { EntityType, selectEntityDisplayData } from '../../redux/slices/localEditsSlice';
import '../../styles/card-page.css';
import translate from '../../utils/translate';

interface UnitViewComponentProps {
	unitId: number;
}

/**
 * Defines the unit info card
 * @param props variables passed in to define
 * @returns Unit info card element
 */
export default function UnitViewComponent(props: UnitViewComponentProps) {
	const [unitData, unsavedChanges] = useAppSelector(state => selectEntityDisplayData(state, { type: EntityType.UNIT, id: props.unitId }));
	// Edit Modal Show
	const { openAdminEditModal } = useAdminEditModalHook({ type: EntityType.UNIT, id: props.unitId });


	return (
		<div className="card">
			<div className="identifier-container">
				{`${unitData.identifier}:${unsavedChanges ? ' (Unsaved Edits)' : ''}`}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="name" /></b> {unitData.name}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.type.of.unit" /></b> {unitData.typeOfUnit}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.represent" /></b> {unitData.unitRepresent}
			</div>
			<div className={unitData.displayable.toString()}>
				<b><FormattedMessage id="displayable" /></b> {unitData.displayable}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.preferred.display" /></b> {translate(`TrueFalseType.${unitData.preferredDisplay.toString()}` as LocaleDataKey)}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.sec.in.rate" /></b> {unitData.secInRate}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="unit.suffix" /></b> {unitData.suffix}
			</div>
			<div className="item-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line. Protect against null from DB in note. */}
				<b><FormattedMessage id="note" /></b> {unitData.note ? unitData.note.slice(0, 29) : ''}
			</div>
			<div className="edit-btn">
				{/* Triggers Global Local */}
				<Button color='secondary' onClick={openAdminEditModal}>
					<FormattedMessage id="edit.unit" />
				</Button>
			</div>
		</div>
	);
}
