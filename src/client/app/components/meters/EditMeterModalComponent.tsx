/* eslint-disable jsdoc/require-returns */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import * as moment from 'moment';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button, Col, Container, FormFeedback, FormGroup,
	Input, Label, ModalBody, ModalFooter, ModalHeader, Row
} from 'reactstrap';
import { selectGroupDataById } from '../../redux/api/groupsApi';
import { metersApi, selectMeterById, selectMeterDataById } from '../../redux/api/metersApi';
import { useLocalEditHook } from '../../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import {
	MAX_DATE, MAX_DATE_MOMENT, MAX_ERRORS,
	MAX_VAL, MIN_DATE, MIN_DATE_MOMENT, MIN_VAL,
	isValidCreateMeter,
	selectGraphicUnitCompatibility
} from '../../redux/selectors/adminSelectors';
import {
	EntityType,
	removeOneEdit
} from '../../redux/slices/localEditsSlice';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { MeterData, MeterTimeSortType, MeterType } from '../../types/redux/meters';
import { GPSPoint, isValidGPSInput } from '../../utils/calibration';
import { AreaUnitType } from '../../utils/getAreaUnitConversion';
import { getGPSString, nullToEmptyString } from '../../utils/input';
import { showErrorNotification } from '../../utils/notifications';
import translate from '../../utils/translate';
import TimeZoneSelect from '../TimeZoneSelect';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';


interface EditMeterModalComponentProps {
	meterId: number;
}
/**
 * Defines the edit meter modal form
 * @param props for the edit component
 * @returns Meter edit element
 */
export default function EditMeterModalComponent(props: EditMeterModalComponentProps) {
	const dispatch = useAppDispatch();
	const [editMeter] = metersApi.useEditMeterMutation();
	// The current meter's state of meter being edited. It should always be valid.
	const meterDataApi = useAppSelector(state => selectMeterById(state, props.meterId));
	const [rState, setRstate] = useLocalEditHook(EntityType.METER, props.meterId);
	const {
		compatibleGraphicUnits,
		incompatibleGraphicUnits,
		compatibleUnits,
		incompatibleUnits
	} = useAppSelector(state => selectGraphicUnitCompatibility(state, rState));
	const groupDataByID = useAppSelector(selectGroupDataById);
	// TODO should this state be used for the meterState above or would that cause issues?
	const meterDataByID = useAppSelector(selectMeterDataById);

	const { meterIsValid, defaultGraphicUnitIsValid } = useAppSelector(state => isValidCreateMeter(state, rState as unknown as MeterData));

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRstate(state => ({ ...state, [e.target.name]: e.target.value }));
	};

	const handleBooleanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRstate(state => ({ ...state, [e.target.name]: JSON.parse(e.target.value) }));
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setRstate(state => ({ ...state, [e.target.name]: Number(e.target.value) }));
	};

	const handleTimeZoneChange = (timeZone: string) => {
		setRstate(state => ({ ...state, ['timeZone']: timeZone }));
	};
	React.useEffect(() => {
		if (!defaultGraphicUnitIsValid) {
			setRstate(state => ({ ...state, defaultGraphicUnit: -99 }));
		}
	}, [rState, defaultGraphicUnitIsValid]);


	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input but this would not detect if edited but no change made.
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks
		// props.handleClose();

		// true if inputted values are okay. Then can submit.
		let inputOk = true;

		// Check for changes by comparing state to props
		const meterHasChanges = !_.isEqual(meterDataApi, rState);

		// Only validate and store if any changes.
		if (meterHasChanges) {
			// Set default identifier as name if left blank
			rState.identifier = (!rState.identifier || rState.identifier.length === 0) ?
				rState.name : rState.identifier;

			// Check GPS entered.
			// Validate GPS is okay and take from string to GPSPoint to submit.
			const gpsInput = rState.gps;
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
					// showErrorNotification(translate('input.gps.range') + state.gps + '.');
					inputOk = false;
				}
			}

			// The message if issue with meter and groups. If blank then no issue.
			let error_message = '';
			// See if the meter unit changed since only allowed if not already in a group.
			if (meterDataApi.unitId !== rState.unitId) {
				// Check if the deep meters of groups in the redux state depend on the meter being edited.
				// If so, the meter should not be edited.
				for (const value of Object.values(groupDataByID)) {
					for (let i = 0; i < value.deepMeters.length; i++) {
						if (value.deepMeters[i] == props.meterId) {
							inputOk = false;
							// TODO Would like line break between messages. See below on issue.
							error_message += `${translate('group')} "${value.name}" ${translate('uses')} ${translate('meter')} "${meterDataByID[value.deepMeters[i]].name}"; `;
						}
					}
				}
			}

			if (inputOk) {
				// The input passed validation.
				// GPS may have been updated so create updated state to submit.
				const submitState = { ...rState, gps };
				// Submit new meter if checks where ok.
				editMeter(submitState);
			} else if (error_message) {
				// Display an error message if there are dependent deep meters and checked.
				// Undo the unit change.
				setRstate(state => ({ ...state, unitId: meterDataApi.unitId }));
				// setLocalMeterEdits({...localMeterEdits, ['unitId']: props.meter.unitId });
				error_message = translate('meter.unit.is.not.editable') + error_message;
				// TODO Attempts to add a line break with \n, <br />, etc. failed when using showErrorNotification.
				// This is going to be a general problem. See https://github.com/fkhadra/react-toastify/issues/687
				// and https://github.com/fkhadra/react-toastify/issues/201.
				showErrorNotification(error_message);
			} else {
				// Tell user that not going to update due to input issues.
				showErrorNotification(translate('meter.input.error'));
			}
		}
	};



	// All modal components other than the Modal itself
	return (
		<>
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
							value={rState.identifier} />
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
							value={rState.name}
							invalid={rState.name === ''} />
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
							value={rState.unitId}
							onChange={e => handleNumberChange(e)}>
							{Array.from(compatibleUnits).map(unit => {
								return (<option value={unit.id} key={unit.id}>{unit.identifier}</option>);
							})}
							{Array.from(incompatibleUnits).map(unit => {
								return (<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>);
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
							value={rState.defaultGraphicUnit}
							onChange={e => handleNumberChange(e)}>
							{
								Array.from(compatibleGraphicUnits).map(unit =>
									<option value={unit.id} key={unit.id}>{unit.identifier}</option>
								)
							}
							{
								Array.from(incompatibleGraphicUnits).map(unit =>
									<option value={unit.id} key={unit.id} disabled>{unit.identifier}</option>
								)
							}
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
							value={rState.enabled?.toString()}
							onChange={e => handleBooleanChange(e)}>
							{
								Object.keys(TrueFalseType).map(key =>
									<option value={key} key={key}>
										{translate(`TrueFalseType.${key}`)}
									</option>
								)
							}
						</Input>
					</FormGroup></Col>
					{/* Displayable input */}
					<Col><FormGroup>
						<Label for='displayable'>{translate('displayable')}</Label>
						<Input
							id='displayable'
							name='displayable'
							type='select'
							value={rState.displayable?.toString()}
							onChange={e => handleBooleanChange(e)}
							invalid={rState.displayable && rState.unitId === -99}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
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
							value={rState.meterType}
							onChange={e => handleStringChange(e)}>
							{/* The dB expects lowercase. */}
							{Object.keys(MeterType).map(key => {
								return (<option value={key.toLowerCase()} key={key.toLowerCase()}>{`${key}`}</option>);
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
							value={rState.readingFrequency}
							invalid={rState.readingFrequency === ''} />
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
							value={nullToEmptyString(rState.url)} />
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
							value={getGPSString(rState.gps)} />
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
							defaultValue={rState.area}
							onChange={e => handleNumberChange(e)}
							invalid={rState.area < 0} />
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
							value={rState.areaUnit}
							onChange={e => handleStringChange(e)}
							invalid={rState.area > 0 && rState.areaUnit === AreaUnitType.none}>
							{Object.keys(AreaUnitType).map(key => {
								return (<option value={key} key={key}>{translate(`AreaUnitType.${key}`)}</option>);
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
						value={nullToEmptyString(rState.note)}
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
							value={rState.cumulative?.toString()}
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
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
							value={rState.cumulativeReset?.toString()}
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
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
							value={rState.cumulativeResetStart}
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
							value={rState?.cumulativeResetEnd}
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
							value={rState.endOnlyTime?.toString()}
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
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
							defaultValue={rState?.readingGap}
							invalid={rState?.readingGap < 0} />
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
							defaultValue={rState?.readingVariation}
							invalid={rState?.readingVariation < 0} />
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
							defaultValue={rState?.readingDuplication}
							invalid={rState?.readingDuplication < 1 || rState?.readingDuplication > 9} />
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
							value={rState?.timeSort}
							onChange={e => handleStringChange(e)}>
							{Object.keys(MeterTimeSortType).map(key => {
								// This is a bit of a hack but it should work fine. The TypeSortTypes and MeterTimeSortType should be in sync.
								// The translation is on the former so we use that enum name there but loop on the other to get the value desired.
								return (<option value={key} key={key}>{translate(`TimeSortTypes.${key}`)}</option>);
							})}
						</Input>
					</FormGroup></Col>
					{/* Timezone input */}
					<Col><FormGroup>
						<Label>{translate('meter.time.zone')}</Label>
						<TimeZoneSelect current={rState.timeZone} handleClick={timeZone => handleTimeZoneChange(timeZone)} />
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
							max={rState.maxVal}
							required value={rState.minVal}
							invalid={rState?.minVal < MIN_VAL || rState?.minVal > rState?.maxVal} />
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: MIN_VAL, max: rState.maxVal }} />
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
							min={rState.minVal}
							max={MAX_VAL}
							required value={rState.maxVal}
							invalid={rState?.maxVal > MAX_VAL || rState?.minVal > rState?.maxVal} />
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: rState.minVal, max: MAX_VAL }} />
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
							required value={rState.minDate}
							invalid={!moment(rState.minDate).isValid()
								|| !moment(rState.minDate).isSameOrAfter(MIN_DATE_MOMENT)
								|| !moment(rState.minDate).isSameOrBefore(moment(rState.maxDate))} />
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: MIN_DATE, max: moment(rState.maxDate).utc().format() }} />
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
							required value={rState.maxDate}
							invalid={!moment(rState.maxDate).isValid()
								|| !moment(rState.maxDate).isSameOrBefore(MAX_DATE_MOMENT)
								|| !moment(rState.maxDate).isSameOrAfter(moment(rState.minDate))} />
						<FormFeedback>
							<FormattedMessage id="error.bounds" values={{ min: moment(rState.minDate).utc().format(), max: MAX_DATE }} />
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
							required value={rState.maxError}
							invalid={rState?.maxError > MAX_ERRORS || rState?.maxError < 0} />
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
							value={rState?.disableChecks?.toString()}
							onChange={e => handleBooleanChange(e)}
							invalid={rState?.disableChecks && rState.unitId === -99}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
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
							defaultValue={rState?.reading} />
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
							value={rState?.startTimestamp} />
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
							value={rState?.endTimestamp} />
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
							value={rState?.previousEnd} />
					</FormGroup></Col>
				</Row>
			</Container></ModalBody>
			<ModalFooter>
				{/* Hides the modal */}
				<Button color='secondary' onClick={() => dispatch(removeOneEdit({ type: EntityType.METER, id: props.meterId }))}>
					<FormattedMessage id="discard.changes" />
				</Button>
				{/* On click calls the function handleSaveChanges in this component */}
				<Button color='primary' onClick={handleSaveChanges} disabled={!meterIsValid}>
					<FormattedMessage id="save.all" />
				</Button>
			</ModalFooter>
		</>
	);
}



const tooltipStyle = {
	...tooltipBaseStyle,
	// Only an admin can edit a meter.
	tooltipEditMeterView: 'help.admin.meteredit'
};