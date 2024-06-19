/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Navigate } from 'react-router-dom';
import MapCalibrationInfoDisplayContainer from '../../containers/maps/MapCalibrationInfoDisplayContainer';
import MapCalibrationInitiateContainer from '../../containers/maps/MapCalibrationInitiateContainer';
import { useAppSelector } from '../../redux/reduxHooks';
import {
	EntityType,
	selectCalibrationMapId,
	selectEntityDisplayData
} from '../../redux/slices/localEditsSlice';
import { CalibrationModeTypes } from '../../types/redux/map';

/**
 * @returns Calibration Component corresponding to current step invloved
 */
export default function MapCalibrationComponent() {
	const mapToCalibrate = useAppSelector(selectCalibrationMapId);
	const calibrationMode = useAppSelector(state => {
		const [data] = selectEntityDisplayData(state, { type: EntityType.MAP, id: mapToCalibrate });
		console.log('CalibrationMode: ', data?.calibrationMode ?? CalibrationModeTypes.unavailable);
		return data?.calibrationMode ?? CalibrationModeTypes.unavailable;
	});
	if (calibrationMode === CalibrationModeTypes.initiate) {
		return (
			<div className='container-fluid'>
				<MapCalibrationInitiateContainer />
			</div >
		);
	} else if (calibrationMode === CalibrationModeTypes.calibrate) {
		return (
			<div className='container-fluid'>
				<div id={'MapCalibrationContainer'}>
					{/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
					{/* @ts-ignore  */}
					<MapCalibrationChartDisplayContainer />
					<MapCalibrationInfoDisplayContainer />
				</div>
			</div>
		);
	} else {
		return <Navigate to='/maps' replace />;
	}
}
