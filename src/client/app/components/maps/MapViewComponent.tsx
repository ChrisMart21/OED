/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import { Button } from 'reactstrap';
import * as moment from 'moment';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';
import { hasToken } from '../../utils/token';
import { showErrorNotification } from '../../utils/notifications';
import '../../styles/card-page.css';
import EditMapModalComponent from './EditMapModalComponent';


interface MapViewProps {
	id: number;
	map: MapMetadata;
	setCalibration(mode: CalibrationModeTypes, mapID: number): any;
	removeMap(id: number): any;
	editMapDetails(map: MapMetadata): any;
}

/**
 * Defines the map info card
 * @param props variables passed in to define
 * @returns Map info card element
 */
function MapViewComponent(props: MapViewProps): React.JSX.Element {
	const [showEditModal, setShowEditModal] = useState(false);
	const intl = useIntl();

	const handleShowModal = () => setShowEditModal(true);
	const handleCloseModal = () => setShowEditModal(false);

	const handleSave = (updatedMap: MapMetadata) => {
		props.editMapDetails(updatedMap);
		handleCloseModal();
	};

	return (
		<div className="map-card">
			<div className="identifier-container">
				{props.map.name}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.displayable" /></b>
				<span style={{ color: props.map.displayable ? 'green' : 'red' }}>
					<FormattedMessage id={props.map.displayable ? 'map.is.displayable' : 'map.is.not.displayable'} />
				</span>
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.circle.size" /></b> {props.map.circleSize}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.modified.date" /></b>
				{moment.parseZone(props.map.modifiedDate, undefined, true).format('dddd, MMM DD, YYYY hh:mm a')}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.filename" /></b> {props.map.filename}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="note" /></b> {props.map.note}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="map.calibration" /></b>
				<span style={{ color: props.map.origin && props.map.opposite ? 'black' : 'gray' }}>
					<FormattedMessage id={props.map.origin && props.map.opposite ? 'map.is.calibrated' : 'map.is.not.calibrated'} />
				</span>
			</div>
			{hasToken() && (
				<div className="edit-btn">
					<Button color='secondary' onClick={handleShowModal}>
						<FormattedMessage id="edit.map" />
					</Button>
				</div>
			)}
			<EditMapModalComponent
				show={showEditModal}
				handleClose={handleCloseModal}
				map={props.map}
				editMapDetails={props.editMapDetails}
				setCalibration={props.setCalibration}
				removeMap={props.removeMap}
			/>
		</div>
	);
}

export default MapViewComponent;