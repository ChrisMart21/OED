/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectVisibleMeterAndGroupData } from '../../redux/selectors/adminSelectors';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import CreateGroupModalComponent from './CreateGroupModalComponent';
import GroupViewComponent from './GroupViewComponent';

/**
 * Defines the groups page card view
 * @returns Groups page element
 */
export default function GroupsDetailComponent() {
	// Check for admin status
	const isAdmin = useAppSelector(state => selectIsAdmin(state));
	const { pathname } = useLocation();

	// We only want displayable groups if non-admins because they still have non-displayable in state.
	const { visibleGroups } = useAppSelector(state => selectVisibleMeterAndGroupData(state));

	const titleStyle: React.CSSProperties = {
		textAlign: 'center'
	};

	const tooltipStyle = {
		display: 'inline-block',
		fontSize: '50%',
		// Switch help depending if admin or not.
		tooltipGroupView: isAdmin ? 'help.admin.groupview' : 'help.groups.groupview'
	};

	// groups/admin uses the same component, the only difference being it is a child of AmindOutlet.
	// This allows for inheritance of other admin specific behaviors of AdminOutlet children.
	return isAdmin && pathname !== '/groups/admin'
		? <Navigate to='/groups/admin' replace />
		: <div className='flexGrowOne'>
			<TooltipHelpComponent page='groups' />

			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='groups' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='groups' helpTextId={tooltipStyle.tooltipGroupView} />
					</div>
				</h2>
				{isAdmin &&
					<div className="edit-btn">
						{/* The actual button for create is inside this component. */}
						< CreateGroupModalComponent />
					</div>
				}
				{
					<div className="card-container">
						{Object.values(visibleGroups)
							.map(groupData => (<GroupViewComponent
								group={groupData}
								key={groupData.id}
							/>))}
					</div>
				}
			</div>
		</div>;
}
