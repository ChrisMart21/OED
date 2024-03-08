/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import { selectMapById } from '../../redux/api/mapsApi';
import { RootState } from '../../store';
import MapViewComponent from '../../components/maps/MapViewComponent';
import { editMapDetails, removeMap, setCalibration } from '../../redux/actions/map';
import { Dispatch } from '../../types/redux/actions';
import { CalibrationModeTypes, MapMetadata } from '../../types/redux/map';

function mapStateToProps(state: RootState, ownProps: { id: number }) {
	return {
		map: selectMapById(state, ownProps.id),
		isEdited: false,
		// isEdited: state.maps.editedMaps[ownProps.id] !== undefined,
		// isSubmitting: state.maps.submitting.indexOf(ownProps.id) !== -1
		isSubmitting: false
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		editMapDetails: (map: MapMetadata) => dispatch(editMapDetails(map)),
		setCalibration: (mode: CalibrationModeTypes, mapID: number) => dispatch(setCalibration(mode, mapID)),
		removeMap: (id: number) => dispatch(removeMap(id))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapViewComponent);
