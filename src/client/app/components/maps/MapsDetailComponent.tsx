/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import MapViewContainer from '../../containers/maps/MapViewContainer';
import { hasToken } from '../../utils/token';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import '../../styles/card-page.css';

interface MapsDetailProps {
	maps: number[];
	fetchMapsDetails(): Promise<any>;
	createNewMap(): any;
}

export default class MapsDetailComponent extends React.Component<MapsDetailProps> {
	public componentDidMount() {
		this.props.fetchMapsDetails();
	}

	public render() {
		return (
			<div className='flexGrowOne'>
				<TooltipHelpComponent page='maps' />
				<div className='container-fluid'>
					<h2 style={titleStyle}>
						<FormattedMessage id='maps' />
						<div style={tooltipStyle}>
							<TooltipMarkerComponent page='maps' helpTextId='help.admin.mapview' />
						</div>
					</h2>
					<div className="edit-btn">
						<Link to='/calibration' onClick={() => this.props.createNewMap()}>
							<Button color='primary'>
								<FormattedMessage id='create.map' />
							</Button>
						</Link>
					</div>
					<div className="card-container">
						{this.props.maps.map(mapID => (
							<MapViewContainer key={mapID} id={mapID} />
						))}
					</div>
				</div>
			</div>
		);
	}
}

const titleStyle: React.CSSProperties = {
	textAlign: 'center'
};

const tooltipStyle = {
	display: 'inline-block',
	fontSize: '50%'
};