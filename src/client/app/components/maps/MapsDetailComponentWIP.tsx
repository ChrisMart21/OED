/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import AdminLocalEditsComponent from '../admin/AdminLocalEditsComponent';
import { selectMapIds } from '../../redux/api/mapsApi';
import { useAppSelector } from '../../redux/reduxHooks';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { MapViewComponent } from './MapViewComponentWIP';


/**
 * Returns the button container style.
 * @returns maps detail component
 */
export default function MapsDetailComponent() {
	// const dispatch = useAppDispatch();
	const mapIds = useAppSelector(selectMapIds);

	return (
		<>
			<AdminLocalEditsComponent />
			<div className='flexGrowOne'>
				<TooltipHelpComponent page='maps' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='maps' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='maps' helpTextId='help.admin.mapview' />
						</div>
					</h2>
					<Link to='/calibration'
						onClick={() => console.log('implement me.')}>
						<Button style={buttonContainerStyle} color='primary'>
							<FormattedMessage id='create.map' />
						</Button>
					</Link>
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
						{/* <Table striped bordered hover>
						<thead>
							<tr>
								<th> <FormattedMessage id='map.id' /> </th>
								<th> <FormattedMessage id='map.name' /> </th>
								{isAdmin &&
									<>
										<th> <FormattedMessage id='map.displayable' /> </th>
										<th> <FormattedMessage id='map.circle.size' /> </th>
										<th> <FormattedMessage id='map.modified.date' /> </th>
										<th> <FormattedMessage id='map.filename' /> </th>
										<th> <FormattedMessage id='note' /> </th>
										<th> <FormattedMessage id='map.calibration' /> </th>
										<th> <FormattedMessage id='remove' /> </th>
									</>
								}
							</tr>
						</thead>
						<tbody>
							<tr>
								<td colSpan={8}>
								</td>
							</tr>
						</tbody>
					</Table> */}
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