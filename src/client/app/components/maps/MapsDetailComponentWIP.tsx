/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { useNavigate } from 'react-router-dom';
import { Button } from 'reactstrap';
import { selectMapIds } from '../../redux/api/mapsApi';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { localEditsSlice } from '../../redux/slices/localEditsSlice';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { MapViewComponent } from './MapViewComponentWIP';


/**
 * Returns the button container style.
 * @returns maps detail component
 */
export default function MapsDetailComponent() {
	const dispatch = useAppDispatch();
	const mapIds = useAppSelector(selectMapIds);
	const nav = useNavigate();

	return (
		<>
			<div className='flexGrowOne'>
				<TooltipHelpComponent page='maps' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='maps' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='maps' helpTextId='help.admin.mapview' />
						</div>
					</h2>
					<Button
						style={buttonContainerStyle}
						color='primary'
						onClick={() => {
							dispatch(localEditsSlice.actions.createNewMap());
							nav('/maps/calibration');
						}}
					>
						<FormattedMessage id='create.map' />
					</Button>
					<Button
						color='success'
						style={buttonContainerStyle}
					>
						<FormattedMessage id='save.map.edits' />
					</Button>
					<div style={tableStyle}>
						{
							mapIds.map(mapID => <MapViewComponent key={mapID} id={mapID} />)
						}
					</div>

				</div>
			</div>
		</>

	);
}

const titleStyle: React.CSSProperties = {
	textAlign: 'center'
};

const tableStyle: React.CSSProperties = {
	marginLeft: '5%',
	marginRight: '5%'
};

const buttonContainerStyle: React.CSSProperties = {
	minWidth: '150px',
	width: '10%',
	marginLeft: '40%',
	marginRight: '40%'
};

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%'
};