/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { unsavedWarningSlice } from '../../reducers/unsavedWarning';
import { metersApi, selectMeterById } from '../../redux/api/metersApi';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { makeSelectGraphicUnitCompatibility } from '../../redux/selectors/adminSelectors';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { MeterData, MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { UnitRepresentType } from '../../types/redux/units';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { getGPSString, notifyUser, nullToEmptyString } from '../../utils/input';
import translate from '../../utils/translate';
import TimeZoneSelect from '../TimeZoneSelect';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

interface EditMeterModalComponentProps {
	show: boolean;
	meter: MeterData;
	// passed in to handle closing the modal
	handleClose: () => void;
}
/**
 * Defines the edit meter modal form
 * @param props for the edit component
 * @returns Meter edit element
 */
export default function EditMeterModalComponent(props: EditMeterModalComponentProps) {
	const dispatch = useAppDispatch();
	const [editMeter] = metersApi.useEditMeterMutation()
	// since this selector is shared amongst many other modals, we must use a selector factory in order
	// to have a single selector per modal instance. Memo ensures that this is a stable reference
	const selectGraphicUnitCompatibility = React.useMemo(makeSelectGraphicUnitCompatibility, [])
	// The current meter's state of meter being edited. It should always be valid.
	const meterState = useAppSelector(state => selectMeterById(state, props.meter.id));
	const [localMeterEdits, setLocalMeterEdits] = useState(_.cloneDeep(meterState));
	const {
		compatibleGraphicUnits,
		incompatibleGraphicUnits,
		compatibleUnits,
		incompatibleUnits
	} = useAppSelector(state => selectGraphicUnitCompatibility(state, localMeterEdits))

	useEffect(() => { setLocalMeterEdits(_.cloneDeep(meterState)) }, [meterState])
	/* State */
	// unit state
	const unitDataById = useAppSelector(selectUnitDataById);


	const [validMeter, setValidMeter] = useState(isValidMeter(localMeterEdits));

	useEffect(() => { setValidMeter(isValidMeter(localMeterEdits)) }, [localMeterEdits]);
	/* End State */


	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input but this would not detect if edited but no change made.
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks
		props.handleClose();

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Check for changes by comparing state to props
		const meterHasChanges = !_.isEqual(meterState, localMeterEdits)

		// Only validate and store if any changes.
		if (meterHasChanges) {
			// Set default identifier as name if left blank
			localMeterEdits.identifier = (!localMeterEdits.identifier || localMeterEdits.identifier.length === 0) ?
				localMeterEdits.name : localMeterEdits.identifier;

			// Check GPS entered.
			// Validate GPS is okay and take from string to GPSPoint to submit.
			const gpsInput = localMeterEdits.gps;
			let gps: GPSPoint | null = null;
			const latitudeIndex = 0;
			const longitudeIndex = 1;
			// If the user input a value then gpsInput should be a string.
			// null came from the DB and it is okay to just leave it - Not a string.
			if (typeof gpsInput === 'string') {
				if (isValidGPSInput(gpsInput)) {
					// Clearly gpsInput is a string but TS complains about the split so cast.
					const gpsValues = (gpsInput as string).split(',').map((value: string) => parseFloat(value));
					// It is valid and needs to be in this format for routing.
					gps = {
						longitude: gpsValues[longitudeIndex],
						latitude: gpsValues[latitudeIndex]
					};
					// gpsInput must be of type string but TS does not think so so cast.
				} else if ((gpsInput as string).length !== 0) {
					// GPS not okay.
					// TODO isValidGPSInput currently tops up an alert so not doing it here, may change
					// so leaving code commented out.
					// notifyUser(translate('input.gps.range') + state.gps + '.');
					inputOk = false;
				}
			}

			if (inputOk) {
				// The input passed validation.
				// GPS may have been updated so create updated state to submit.
				const submitState = { ...localMeterEdits, gps };
				// The reading views need to be refreshed if going to/from no unit or
				// to/from type quantity.
				// The check does it by first seeing if the unit changed and, if so, it
				// sees if either were non unit meaning it crossed since both cannot be no unit
				// or the unit change to/from quantity.
				const shouldRefreshReadingViews = (props.meter.unitId != localMeterEdits.unitId) &&
					((props.meter.unitId == -99 || localMeterEdits.unitId == -99) ||
						(unitDataById[props.meter.unitId].unitRepresent == UnitRepresentType.quantity
							&& unitDataById[localMeterEdits.unitId].unitRepresent != UnitRepresentType.quantity) ||
						(unitDataById[props.meter.unitId].unitRepresent != UnitRepresentType.quantity
							&& unitDataById[localMeterEdits.unitId].unitRepresent == UnitRepresentType.quantity));
				// Submit new meter if checks where ok.
				// dispatch(submitEditedMeter(submitState, shouldRefreshReadingViews) as ThunkAction<void, RootState, unknown, AnyAction>);
				editMeter({ meterData: submitState, shouldRefreshViews: shouldRefreshReadingViews })
				dispatch(unsavedWarningSlice.actions.removeUnsavedChanges());
			} else {
				// Tell user that not going to update due to input issues.
				notifyUser(translate('meter.input.error'));
			}
		}
	};

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalMeterEdits({ ...localMeterEdits, [e.target.name]: e.target.value.trim() });
	}

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalMeterEdits({ ...localMeterEdits, [e.target.name]: JSON.parse(e.target.value) });
	}

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setLocalMeterEdits({ ...localMeterEdits, [e.target.name]: Number(e.target.value) });
	}

	const handleTimeZoneChange = (timeZone: string) => {
		setLocalMeterEdits({ ...localMeterEdits, ['timeZone']: timeZone });
	}
	// Reset the state to default values
	// To be used for the discard changes button
	// Different use case from CreateMeterModalComponent's resetState
	// This allows us to reset our state to match the store in the event of an edit failure
	// Failure to edit meters will not trigger a re-render, as no state has changed. Therefore, we must manually reset the values
	const resetState = () => {
		setLocalMeterEdits(meterState);
	}

	const handleClose = () => {
		props.handleClose();
		resetState();
	}
	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose} size='lg'>
				<ModalHeader>
					<FormattedMessage id="edit.meter" />
					<TooltipHelpComponent page='meters-edit' />
					<div style={tooltipStyle}>
						<TooltipMarkerComponent page='meters-edit' helpTextId={tooltipStyle.tooltipEditMeterView} />
					</div>
				</ModalHeader>
				{/* when any of the Meter values are changed call one of the functions. */}
				<ModalBody><Container>
					<Row xs='1' lg='2'>
						{/* Identifier input */}
						<Col><FormGroup>
							<Label for='identifier'>{translate('identifier')}</Label>
							<Input
								id='identifier'
								name='identifier'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={localMeterEdits.identifier} />
						</FormGroup></Col>
						{/* Name input */}
						<Col><FormGroup>
							<Label for='name'>{translate('name')}</Label>
							<Input
								id='name'
								name='name'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={localMeterEdits.name}
								invalid={localMeterEdits.name === ''} />
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* meter unit input */}
						<Col><FormGroup>
							<Label for='unitId'>{translate('meter.unitName')}</Label>
							<Input
								id='unitId'
								name='unitId'
								type='select'
								value={localMeterEdits.unitId}
								onChange={e => handleNumberChange(e)}>
								{Array.from(compatibleUnits).map(unit => {
									return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
								})}
								{Array.from(incompatibleUnits).map(unit => {
									return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* default graphic unit input */}
						<Col><FormGroup>
							<Label for='defaultGraphicUnit'>{translate('defaultGraphicUnit')}</Label>
							<Input
								id='defaultGraphicUnit'
								name='defaultGraphicUnit'
								type='select'
								value={localMeterEdits.defaultGraphicUnit}
								onChange={e => handleNumberChange(e)}>
								{Array.from(compatibleGraphicUnits).map(unit => {
									return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>)
								})}
								{Array.from(incompatibleGraphicUnits).map(unit => {
									return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>)
								})}
							</Input>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Enabled input */}
						<Col><FormGroup>
							<Label for='enabled'>{translate('meter.enabled')}</Label>
							<Input
								id='enabled'
								name='enabled'
								type='select'
								// There is a subtle difference from create. In crete the state is set to
								// the default values so always is there. In edit, it comes via props so
								// it may not be set before the meter state is fetched. This probably only
								// happens when your reload one of these pages but to avoid issues it uses
								// the ? to avoid access. This only applies to items where you dereference
								// the state value such as .toString() here.
								value={localMeterEdits.enabled?.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* Displayable input */}
						<Col><FormGroup>
							<Label for='displayable'>{translate('displayable')}</Label>
							<Input
								id='displayable'
								name='displayable'
								type='select'
								value={localMeterEdits.displayable?.toString()}
								onChange={e => handleBooleanChange(e)}
								invalid={localMeterEdits.displayable && localMeterEdits.unitId === -99}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
							<FormFeedback>
								<FormattedMessage id="error.displayable" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Meter type input */}
						<Col><FormGroup>
							<Label for='meterType'>{translate('meter.type')}</Label>
							<Input
								id='meterType'
								name='meterType'
								type='select'
								value={localMeterEdits.meterType}
								onChange={e => handleStringChange(e)}>
								{/* The dB expects lowercase. */}
								{Object.keys(MeterType).map(key => {
									return (<option value={key.toLowerCase()} key={key.toLowerCase()}>{`${key}`}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* Meter reading frequency */}
						<Col><FormGroup>
							<Label for='readingFrequency'>{translate('meter.readingFrequency')}</Label>
							<Input
								id='readingFrequency'
								name='readingFrequency'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={localMeterEdits.readingFrequency}
								invalid={localMeterEdits.readingFrequency === ''} />
							<FormFeedback>
								<FormattedMessage id="error.required" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* URL input */}
						<Col><FormGroup>
							<Label for='url'>{translate('meter.url')}</Label>
							<Input
								id='url'
								name='url'
								type='text'
								autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={nullToEmptyString(localMeterEdits.url)} />
						</FormGroup></Col>
						{/* GPS input */}
						<Col><FormGroup>
							<Label for='gps'>{translate('gps')}</Label>
							<Input
								id='gps'
								name='gps'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								value={getGPSString(localMeterEdits.gps)} />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* Area input */}
						<Col><FormGroup>
							<Label for='area'>{translate('area')}</Label>
							<Input
								id='area'
								name='area'
								type='number'
								min='0'
								defaultValue={localMeterEdits.area}
								onChange={e => handleNumberChange(e)}
								invalid={localMeterEdits.area < 0} />
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
						{/* meter area unit input */}
						<Col><FormGroup>
							<Label for='areaUnit'>{translate('area.unit')}</Label>
							<Input
								id='areaUnit'
								name='areaUnit'
								type='select'
								value={localMeterEdits.areaUnit}
								onChange={e => handleStringChange(e)}
								invalid={localMeterEdits.area > 0 && localMeterEdits.areaUnit === AreaUnitType.none}>
								{Object.keys(AreaUnitType).map(key => {
									return (<option value={key} key={key}>{translate(`AreaUnitType.${key}`)}</option>)
								})}
							</Input>
							<FormFeedback>
								<FormattedMessage id="area.but.no.unit" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					{/* note input */}
					<FormGroup>
						<Label for='note'>{translate('note')}</Label>
						<Input
							id='note'
							name='note'
							type='textarea'
							onChange={e => handleStringChange(e)}
							value={nullToEmptyString(localMeterEdits.note)}
							placeholder='Note' />
					</FormGroup>
					<Row xs='1' lg='2'>
						{/* cumulative input */}
						<Col><FormGroup>
							<Label for='cumulative'>{translate('meter.cumulative')}</Label>
							<Input
								id='cumulative'
								name='cumulative'
								type='select'
								value={localMeterEdits.cumulative?.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* cumulativeReset input */}
						<Col><FormGroup>
							<Label for='cumulativeReset'>{translate('meter.cumulativeReset')}</Label>
							<Input
								id='cumulativeReset'
								name='cumulativeReset'
								type='select'
								value={localMeterEdits.cumulativeReset?.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* cumulativeResetStart input */}
						<Col><FormGroup>
							<Label for='cumulativeResetStart'>{translate('meter.cumulativeResetStart')}</Label>
							<Input
								id='cumulativeResetStart'
								name='cumulativeResetStart'
								type='text'
								autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={localMeterEdits.cumulativeResetStart}
								placeholder='HH:MM:SS' />
						</FormGroup></Col>
						{/* cumulativeResetEnd input */}
						<Col><FormGroup>
							<Label for='cumulativeResetEnd'>{translate('meter.cumulativeResetEnd')}</Label>
							<Input
								id='cumulativeResetEnd'
								name='cumulativeResetEnd'
								type='text'
								autoComplete='off'
								onChange={e => handleStringChange(e)}
								value={localMeterEdits?.cumulativeResetEnd}
								placeholder='HH:MM:SS' />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* endOnlyTime input */}
						<Col><FormGroup>
							<Label for='endOnlyTime'>{translate('meter.endOnlyTime')}</Label>
							<Input
								id='endOnlyTime'
								name='endOnlyTime'
								type='select'
								value={localMeterEdits.endOnlyTime?.toString()}
								onChange={e => handleBooleanChange(e)}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* readingGap input */}
						<Col><FormGroup>
							<Label for='readingGap'>{translate('meter.readingGap')}</Label>
							<Input
								id='readingGap'
								name='readingGap'
								type='number'
								onChange={e => handleNumberChange(e)}
								min='0'
								defaultValue={localMeterEdits?.readingGap}
								invalid={localMeterEdits?.readingGap < 0} />
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* readingVariation input */}
						<Col><FormGroup>
							<Label for='readingVariation'>{translate('meter.readingVariation')}</Label>
							<Input
								id='readingVariation'
								name='readingVariation'
								type='number'
								onChange={e => handleNumberChange(e)}
								min='0'
								defaultValue={localMeterEdits?.readingVariation}
								invalid={localMeterEdits?.readingVariation < 0} />
							<FormFeedback>
								<FormattedMessage id="error.negative" />
							</FormFeedback>
						</FormGroup></Col>
						{/* readingDuplication input */}
						<Col><FormGroup>
							<Label for='readingDuplication'>{translate('meter.readingDuplication')}</Label>
							<Input
								id='readingDuplication'
								name='readingDuplication'
								type='number'
								onChange={e => handleNumberChange(e)}
								step='1'
								min='1'
								max='9'
								defaultValue={localMeterEdits?.readingDuplication}
								invalid={localMeterEdits?.readingDuplication < 1 || localMeterEdits?.readingDuplication > 9} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: '1', max: '9' }} />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* timeSort input */}
						<Col><FormGroup>
							<Label for='timeSort'>{translate('meter.timeSort')}</Label>
							<Input
								id='timeSort'
								name='timeSort'
								type='select'
								value={localMeterEdits?.timeSort}
								onChange={e => handleStringChange(e)}>
								{Object.keys(MeterTimeSortType).map(key => {
									// This is a bit of a hack but it should work fine. The TypeSortTypes and MeterTimeSortType should be in sync.
									// The translation is on the former so we use that enum name there but loop on the other to get the value desired.
									return (<option value={key} key={key}>{translate(`TimeSortTypes.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
						{/* Timezone input */}
						<Col><FormGroup>
							<Label>{translate('meter.time.zone')}</Label>
							<TimeZoneSelect current={localMeterEdits.timeZone} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* minVal input */}
						<Col><FormGroup>
							<Label for='minVal'>{translate('meter.minVal')}</Label>
							<Input
								id='minVal'
								name='minVal'
								type='number'
								onChange={e => handleNumberChange(e)}
								min={MIN_VAL}
								max={localMeterEdits.maxVal}
								required value={localMeterEdits.minVal}
								invalid={localMeterEdits?.minVal < MIN_VAL || localMeterEdits?.minVal > localMeterEdits?.maxVal} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: MIN_VAL, max: localMeterEdits.maxVal }} />
							</FormFeedback>
						</FormGroup></Col>
						{/* maxVal input */}
						<Col><FormGroup>
							<Label for='maxVal'>{translate('meter.maxVal')}</Label>
							<Input
								id='maxVal'
								name='maxVal'
								type='number'
								onChange={e => handleNumberChange(e)}
								min={localMeterEdits.minVal}
								max={MAX_VAL}
								required value={localMeterEdits.maxVal}
								invalid={localMeterEdits?.maxVal > MAX_VAL || localMeterEdits?.minVal > localMeterEdits?.maxVal} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: localMeterEdits.minVal, max: MAX_VAL }} />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* minDate input */}
						<Col><FormGroup>
							<Label for='minDate'>{translate('meter.minDate')}</Label>
							<Input
								id='minDate'
								name='minDate'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								required value={localMeterEdits.minDate}
								invalid={!moment(localMeterEdits.minDate).isValid()
									|| !moment(localMeterEdits.minDate).isSameOrAfter(MIN_DATE_MOMENT)
									|| !moment(localMeterEdits.minDate).isSameOrBefore(moment(localMeterEdits.maxDate))} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: MIN_DATE, max: moment(localMeterEdits.maxDate).utc().format() }} />
							</FormFeedback>
						</FormGroup></Col>
						{/* maxDate input */}
						<Col><FormGroup>
							<Label for='maxDate'>{translate('meter.maxDate')}</Label>
							<Input
								id='maxDate'
								name='maxDate'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								required value={localMeterEdits.maxDate}
								invalid={!moment(localMeterEdits.maxDate).isValid()
									|| !moment(localMeterEdits.maxDate).isSameOrBefore(MAX_DATE_MOMENT)
									|| !moment(localMeterEdits.maxDate).isSameOrAfter(moment(localMeterEdits.minDate))} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: moment(localMeterEdits.minDate).utc().format(), max: MAX_DATE }} />
							</FormFeedback>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* maxError input */}
						<Col><FormGroup>
							<Label for='maxError'>{translate('meter.maxError')}</Label>
							<Input
								id='maxError'
								name='maxError'
								type='number'
								onChange={e => handleNumberChange(e)}
								min='0'
								max={MAX_ERRORS}
								required value={localMeterEdits.maxError}
								invalid={localMeterEdits?.maxError > MAX_ERRORS || localMeterEdits?.maxError < 0} />
							<FormFeedback>
								<FormattedMessage id="error.bounds" values={{ min: 0, max: MAX_ERRORS }} />
							</FormFeedback>
						</FormGroup></Col>
						{/* DisableChecks input */}
						<Col><FormGroup>
							<Label for='disableChecks'>{translate('meter.disableChecks')}</Label>
							<Input
								id='disableChecks'
								name='disableChecks'
								type='select'
								value={localMeterEdits?.disableChecks?.toString()}
								onChange={e => handleBooleanChange(e)}
								invalid={localMeterEdits?.disableChecks && localMeterEdits.unitId === -99}>
								{Object.keys(TrueFalseType).map(key => {
									return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>)
								})}
							</Input>
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* reading input */}
						<Col><FormGroup>
							<Label for='reading'>{translate('meter.reading')}</Label>
							<Input
								id='reading'
								name='reading'
								type='number'
								onChange={e => handleNumberChange(e)}
								defaultValue={localMeterEdits?.reading} />
						</FormGroup></Col>
						{/* startTimestamp input */}
						<Col><FormGroup>
							<Label for='startTimestamp'>{translate('meter.startTimeStamp')}</Label>
							<Input
								id='startTimestamp'
								name='startTimestamp'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={localMeterEdits?.startTimestamp} />
						</FormGroup></Col>
					</Row>
					<Row xs='1' lg='2'>
						{/* endTimestamp input */}
						<Col><FormGroup>
							<Label for='endTimestamp'>{translate('meter.endTimeStamp')}</Label>
							<Input
								id='endTimestamp'
								name='endTimestamp'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={localMeterEdits?.endTimestamp} />
						</FormGroup></Col>
						{/* previousEnd input */}
						<Col><FormGroup>
							<Label for='previousEnd'>{translate('meter.previousEnd')}</Label>
							<Input
								id='previousEnd'
								name='previousEnd'
								type='text'
								autoComplete='on'
								onChange={e => handleStringChange(e)}
								placeholder='YYYY-MM-DD HH:MM:SS'
								value={localMeterEdits?.previousEnd} />
						</FormGroup></Col>
					</Row>
				</Container></ModalBody>
				<ModalFooter>
					{/* Hides the modal */}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* On click calls the function handleSaveChanges in this component */}
					<Button color='primary' onClick={handleSaveChanges} disabled={!validMeter}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal >
		</>
	);
}


const MIN_VAL = Number.MIN_SAFE_INTEGER;
const MAX_VAL = Number.MAX_SAFE_INTEGER;
const MIN_DATE_MOMENT = moment(0).utc();
const MAX_DATE_MOMENT = moment(0).utc().add(5000, 'years');
const MIN_DATE = MIN_DATE_MOMENT.format('YYYY-MM-DD HH:mm:ssZ');
const MAX_DATE = MAX_DATE_MOMENT.format('YYYY-MM-DD HH:mm:ssZ');
const MAX_ERRORS = 75;
const tooltipStyle = {
	...tooltipBaseStyle,
	// Only and admin can edit a meter.
	tooltipEditMeterView: 'help.admin.meteredit'
};

const isValidMeter = (localMeterEdits: MeterData) => {
	/* Edit Meter Validation:
		Name cannot be blank
		Area must be positive or zero
		If area is nonzero, area unit must be set
		Reading Gap must be greater than zero
		Reading Variation must be greater than zero
		Reading Duplication must be between 1 and 9
		Reading frequency cannot be blank
		If displayable is true and unitId is set to -99, warn admin
		Minimum Value cannot bigger than Maximum Value
		Minimum Value and Maximum Value must be between valid input
		Minimum Date and Maximum cannot be blank
		Minimum Date cannot be after Maximum Date
		Minimum Date and Maximum Value must be between valid input
		Maximum No of Error must be between 0 and valid input
	*/
	return localMeterEdits.name !== '' &&
		(localMeterEdits.area === 0 || (localMeterEdits.area > 0 && localMeterEdits.areaUnit !== AreaUnitType.none)) &&
		localMeterEdits.readingGap >= 0 &&
		localMeterEdits.readingVariation >= 0 &&
		(localMeterEdits.readingDuplication >= 1 && localMeterEdits.readingDuplication <= 9) &&
		localMeterEdits.readingFrequency !== '' &&
		localMeterEdits.minVal >= MIN_VAL &&
		localMeterEdits.minVal <= localMeterEdits.maxVal &&
		localMeterEdits.maxVal <= MAX_VAL &&
		moment(localMeterEdits.minDate).isValid() &&
		moment(localMeterEdits.maxDate).isValid() &&
		moment(localMeterEdits.minDate).isSameOrAfter(MIN_DATE_MOMENT) &&
		moment(localMeterEdits.minDate).isSameOrBefore(moment(localMeterEdits.maxDate)) &&
		moment(localMeterEdits.maxDate).isSameOrBefore(MAX_DATE_MOMENT) &&
		(localMeterEdits.maxError >= 0 && localMeterEdits.maxError <= MAX_ERRORS)
}