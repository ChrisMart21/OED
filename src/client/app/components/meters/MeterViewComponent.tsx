/* This Source Code Form is subject to the terms of the Mozilla Public
	* License, v. 2.0. If a copy of the MPL was not distributed with this
	* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { selectMeterById } from '../../redux/api/metersApi';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectGraphicName, selectUnitName } from '../../redux/selectors/adminSelectors';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import { EntityType, openModalWithID, selectEditById } from '../../redux/slices/localEditsSlice';
import '../../styles/card-page.css';
import translate from '../../utils/translate';

interface MeterViewComponentProps {
	meterId: number;
}

/**
 * Defines the meter info card
 * @param props component props
 * @returns Meter info card element
 */
export default function MeterViewComponent(props: MeterViewComponentProps) {
	const { meterId } = props;
	// Check for admin status
	const loggedInAsAdmin = useAppSelector(selectIsAdmin);
	const meterData = useAppSelector(state => selectMeterById(state, meterId));
	const edits = useAppSelector(state => selectEditById(state, { type: EntityType.METER, id: meterId }));

	const dispatch = useAppDispatch();
	const editMeter = React.useCallback(() => dispatch(openModalWithID(meterId)), [meterId]);

	// Set up to display the units associated with the meter as the unit identifier.
	// This is the unit associated with the meter.
	const unitName = useAppSelector(state => selectUnitName(state, meterData.id));
	// This is the default graphic unit  name associated with the meter.
	const graphicName = useAppSelector(state => selectGraphicName(state, meterData.id));

	// Only display limited data if not an admin.
	return (
		<div className="card">
			<div className="identifier-container">
				{`${meterData.identifier}:${edits ? ' (Edited)' : ''}`}
			</div>
			{loggedInAsAdmin &&
				<div className="item-container">
					<b><FormattedMessage id="name" /></b> {meterData.name}
				</div>
			}
			<div className="item-container">
				<b><FormattedMessage id="meter.unitName" /></b> {unitName}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="defaultGraphicUnit" /></b> {graphicName}
			</div>
			{loggedInAsAdmin &&
				<div className="item-container">
					<b><FormattedMessage id="meter.enabled" /></b> {translate(`TrueFalseType.${meterData.enabled.toString()}`)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className={meterData.displayable.toString()}>
					<b><FormattedMessage id="displayable" /></b> {translate(`TrueFalseType.${meterData.displayable.toString()}`)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className="item-container">
					{/* Only show first 30 characters so card does not get too big. Should limit to one line. Check in case null. */}
					<b><FormattedMessage id="note" /></b> {meterData.note?.slice(0, 29)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className="edit-btn">
					<Button color='secondary' onClick={editMeter}>
						<FormattedMessage id="edit.meter" />
					</Button>
				</div>
			}
		</div>
	);
}
