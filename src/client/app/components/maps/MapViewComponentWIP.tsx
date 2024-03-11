/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { parseZone } from 'moment';
import * as React from 'react';
import { Button, Card, CardBody, CardImg, CardTitle, Col, Row } from 'reactstrap';
import { useTranslate } from '../../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectMapMetaData } from '../../redux/selectors/mapsSelectors';
import { openModalWithID } from '../../redux/slices/localEditsSlice';


export const MapViewComponent = (props: { id: number; }) => {
	const dispatch = useAppDispatch();
	const mapData = useAppSelector(state => selectMapMetaData(state, props.id));
	const translate = useTranslate();

	return (
		<Card>
			<CardImg
				top
				alt={`${mapData?.name} image cap`}
				src={mapData?.mapSource}
				style={{ height: 250 }}
			/>
			<CardBody>
				{
					/*
						id='map.id' /> </th>
						id='map.name' /> </th>
						id='map.displayable' /> </th>
						id='map.circle.size' /> </th>
						id='map.modified.date' /> </th>
						id='map.filename' /> </th>
						id='note' /> </th>
						id='map.calibration' /> </th>
						id='remove' /> </th>
						*/
				}
				<CardTitle tag="h5">{mapData?.name}</CardTitle>
				<Row>
					<Col>{mapData?.filename}</Col>
				</Row>
				<Row>
					<Col><b>{mapData?.displayable ? translate('map.is.displayable') : translate('map.is.not.displayable')}</b></Col>
				</Row>
				<Row>
					<Col><b>{translate('map.circle.size')}</b>: {mapData?.circleSize}</Col>
				</Row>
				<Row>
					<Col><b>{translate('map.modified.date')}:</b> {parseZone(mapData?.modifiedDate, undefined, true).format('dddd, MMM DD, YYYY hh:mm a')}</Col>
				</Row>
				<Row>
					<Col><b>{translate('note')}</b> {mapData?.note?.slice(0, 29)}</Col>
				</Row>
				<Row>
					<Col>
						<Button color="secondary" onClick={() => dispatch(openModalWithID(props.id))}>{translate('edit')}</Button>
					</Col>
				</Row>
			</CardBody>
		</Card>

	);
};

