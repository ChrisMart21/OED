/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import '../../styles/card-page.css';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateMeterModalComponent from './CreateMeterModalComponent';
import MeterViewComponent from './MeterViewComponent';

/**
 * Defines the meters page card view
 * @returns Meters page element
 */
export default function MetersDetailComponent() {



	// Check for admin status
	const isAdmin = useAppSelector(selectIsAdmin);
	const { pathname } = useLocation();
	// We only want displayable meters if non-admins because they still have
	// non-displayable in state.
	const { visibleMeters } = useAppSelector(selectVisibleMeterAndGroupData);

	// meters/admin uses the same page, but  AmindOutlet is a child of AdminOutlet.
	// This allows for inheritance of admin specific behaviors of AdminOutlet children.
	return isAdmin && pathname !== '/meters/admin'
		? <Navigate to='/meters/admin' replace />
		: <div className='flexGrowOne'>
			<TooltipHelpComponent page='meters' />

			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='meters' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='meters' helpTextId={getToolTipMessage(isAdmin)} />
					</div>
				</h2>
				{
					isAdmin &&
					<div className="edit-btn">
						<CreateMeterModalComponent />
					</div>
				}
				<div className="card-container">
					{
						// Create a MeterViewComponent for each MeterData in Meters State
						Object.values(visibleMeters).map(MeterData =>
							<MeterViewComponent
								key={`${MeterData.id}:${MeterData.identifier}`}
								meterId={MeterData.id}
							/>
						)
					}
				</div>
			</div>
		</div >;
}

const titleStyle: React.CSSProperties = {
	textAlign: 'center'
};

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%'
};

// Switch help depending if admin or not.
const getToolTipMessage = (isAdmin: boolean) => isAdmin ? 'help.admin.meterview' : 'help.meters.meterview';
