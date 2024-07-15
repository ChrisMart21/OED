/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
//Realize that * is already imported from react
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormFeedback, FormGroup, Input, Label, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { selectAllConversions } from '../../redux/api/conversionsApi';
import { selectMeterDataById } from '../../redux/api/metersApi';
import { selectUnitDataById, unitsApi } from '../../redux/api/unitsApi';
import { useLocalEditHook, useTranslate } from '../../redux/componentHooks';
import { useAppSelector } from '../../redux/reduxHooks';
import { EntityType } from '../../redux/slices/localEditsSlice';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import { DisplayableType, UnitRepresentType, UnitType } from '../../types/redux/units';
import { conversionArrow } from '../../utils/conversionArrow';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import TooltipMarkerComponent from '../TooltipMarkerComponent';

interface EditUnitModalComponentProps {
	unitId: number;
}

/**
 * Defines the edit unit modal form
 * @param props props for component
 * @returns Unit edit element
 */
export default function EditUnitModalComponent(props: EditUnitModalComponentProps) {
	const [submitEditedUnit] = unitsApi.useEditUnitMutation();
	const [deleteUnit] = unitsApi.useDeleteUnitMutation();
	const translate = useTranslate();
	const {
		data: unitData,
		apiData: unitApiData,
		resetData,
		handlers: { handleStringChange, handleBooleanChange, handleNumberChange }
	} = useLocalEditHook(EntityType.UNIT, props.unitId);

	// Set existing unit values
	/* State */
	// Handlers for each type of input change
	// const [unitData, setUnitData] = useState(values);
	const conversionData = useAppSelector(selectAllConversions);
	const meterDataByID = useAppSelector(selectMeterDataById);
	const unitDataByID = useAppSelector(selectUnitDataById);


	const handleDeleteUnit = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		// setShowDeleteConfirmationModal(false);

		let error_message = '';
		for (const value of Object.values(meterDataByID)) {
			// This unit is used by a meter so cannot be deleted. Note if in a group then in a meter so covers both.
			if (value.unitId == unitData.id) {
				// TODO see EditMeterModalComponent for issue with line breaks. Same issue in strings below.
				error_message += ` ${translate('meter')} "${value.name}" ${translate('uses')} ${translate('unit')} ` +
					`"${unitData.name}" ${translate('as.meter.unit')};`;
			}
			if (value.defaultGraphicUnit == unitData.id) {
				error_message += ` ${translate('meter')} "${value.name}" ${translate('uses')} ${translate('unit')} ` +
					`"${unitData.name}" ${translate('as.meter.defaultgraphicunit')};`;
			}
		}
		for (let i = 0; i < conversionData.length; i++) {
			if (conversionData[i].sourceId == unitData.id) {
				// This unit is the source of a conversion so cannot be deleted.
				error_message += ` ${translate('conversion')} ${unitDataByID[conversionData[i].sourceId].name}` +
					`${conversionArrow(conversionData[i].bidirectional)}` +
					`${unitDataByID[conversionData[i].destinationId].name} ${translate('uses')} ${translate('unit')}` +
					` "${unitData.name}" ${translate('unit.source.error')};`;
			}

			if (conversionData[i].destinationId == unitData.id) {
				// This unit is the destination of a conversion so cannot be deleted.
				error_message += ` ${translate('conversion')} ${unitDataByID[conversionData[i].sourceId].name}` +
					`${conversionArrow(conversionData[i].bidirectional)}` +
					`${unitDataByID[conversionData[i].destinationId].name} ${translate('uses')} ${translate('unit')}` +
					` "${unitData.name}" ${translate('unit.destination.error')};`;
			}
		}
		if (error_message) {
			error_message = `${translate('unit.failed.to.delete.unit')}: ${error_message}`;
			showErrorNotification(error_message);
		} else {
			// It is okay to delete this unit.
			deleteUnit(unitData.id)
				.unwrap()
				.then(() => { showSuccessNotification(translate('unit.delete.success')); })
				.catch(error => { showErrorNotification(translate('unit.delete.failure') + error.data); });
		}
	};

	/* Edit Unit Validation:
		Name cannot be blank
		Sec in Rate must be greater than zero
		Unit type mismatches checked on submit
		If type of unit is suffix their must be a suffix
	*/
	const [validUnit, setValidUnit] = useState(false);
	useEffect(() => {
		setValidUnit(unitData.name !== '' && unitData.secInRate > 0 &&
			(unitData.typeOfUnit !== UnitType.suffix || unitData.suffix !== ''));
	}, [unitData.name, unitData.secInRate, unitData.typeOfUnit, unitData.suffix]);
	/* End State */


	const handleClose = () => {
		resetData();
	};

	// Validate the changes and return true if we should update this unit.
	// Two reasons for not updating the unit:
	//	1. typeOfUnit is changed from meter to something else while some meters are still linked with this unit
	//	2. There are no changes
	const shouldUpdateUnit = (): boolean => {
		// true if inputted values are okay and there are changes.
		let inputOk = true;

		// Check for case 1
		if (unitApiData.typeOfUnit === UnitType.meter && unitData.typeOfUnit !== UnitType.meter) {
			// Get an array of all meters
			const meters = Object.values(meterDataByID);
			const meter = meters.find(m => m.unitId === unitApiData.id);
			if (meter) {
				// There exists a meter that is still linked with this unit
				showErrorNotification(`${translate('the.unit.of.meter')} ${meter.name} ${translate('meter.unit.change.requires')}`);
				inputOk = false;
			}
		}
		if (inputOk) {
			// The input passed validation so check if changes exist.
			// Check for case 2 by comparing state to props
			return unitApiData.name != unitData.name
				|| unitApiData.identifier != unitData.identifier
				|| unitApiData.typeOfUnit != unitData.typeOfUnit
				|| unitApiData.unitRepresent != unitData.unitRepresent
				|| unitApiData.displayable != unitData.displayable
				|| unitApiData.preferredDisplay != unitData.preferredDisplay
				|| unitApiData.secInRate != unitData.secInRate
				|| unitApiData.suffix != unitData.suffix
				|| unitApiData.note != unitData.note;
		} else {
			// Tell user that not going to update due to input issues.
			showErrorNotification(`${translate('unit.input.error')}`);
			return false;
		}
	};

	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks

		if (shouldUpdateUnit()) {
			// Need to redo Cik if the suffix, displayable, or type of unit changes.
			// For displayable, it only matters if it changes from/to NONE but a more general check is used here for simplification.
			const shouldRedoCik = unitApiData.suffix !== unitData.suffix
				|| unitApiData.typeOfUnit !== unitData.typeOfUnit
				|| unitApiData.displayable !== unitData.displayable;
			// Need to refresh reading views if unitRepresent or secInRate (when the unit is flow or raw) changes.
			const shouldRefreshReadingViews = unitApiData.unitRepresent !== unitData.unitRepresent
				|| (unitApiData.secInRate !== unitData.secInRate
					&& (unitApiData.unitRepresent === UnitRepresentType.flow || unitApiData.unitRepresent === UnitRepresentType.raw));
			// set displayable to none if unit is meter
			if (unitData.typeOfUnit == UnitType.meter && unitData.displayable != DisplayableType.none) {
				unitData.displayable = DisplayableType.none;
			}
			// set unit to suffix if suffix is not empty
			if (unitData.typeOfUnit != UnitType.suffix && unitData.suffix != '') {
				unitData.typeOfUnit = UnitType.suffix;
			}
			// Save our changes by dispatching the submitEditedUnit mutation
			submitEditedUnit({ editedUnit: unitData, shouldRedoCik, shouldRefreshReadingViews })
				.unwrap()
				.then(() => {
					showSuccessNotification(translate('unit.successfully.edited.unit'));
				})
				.catch(() => {
					showErrorNotification(translate('unit.failed.to.edit.unit'));
				});
			// The updated unit is not fetched to save time. However, the identifier might have been
			// automatically set if it was empty. Mimic that here.
			if (unitData.identifier === '') {
				unitData.identifier = unitData.name;
			}
		}
	};

	// Check if the unit is used in any conversion.
	// 1. If the unit is used, the Unit Represent cannot be changed.
	// 2. Otherwise, the Unit Represent can be changed.
	const inConversions = () => {
		for (const conversion of conversionData) {
			if (conversion.sourceId === unitData.id || conversion.destinationId === unitData.id) {
				return true;
			}
		}
		return false;
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditUnitView: 'help.admin.unitedit'
	};

	return (
		<>
			<ModalHeader>
				<FormattedMessage id="edit.unit" />
				<TooltipHelpComponent page='units-edit' />
				<div style={tooltipStyle}>
					<TooltipMarkerComponent page='units-edit' helpTextId={tooltipStyle.tooltipEditUnitView} />
				</div>
			</ModalHeader>
			{/* when any of the unit are changed call one of the functions. */}
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
							value={unitData.identifier}
							placeholder='Identifier' />
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
							value={unitData.name}
							invalid={unitData.name === ''} />
						<FormFeedback>
							<FormattedMessage id="error.required" />
						</FormFeedback>
					</FormGroup></Col>
				</Row>
				<Row xs='1' lg='2'>
					{/* Type of unit input */}
					<Col><FormGroup>
						<Label for='typeOfUnit'>{translate('unit.type.of.unit')}</Label>
						<Input
							id='typeOfUnit'
							name='typeOfUnit'
							type='select'
							onChange={e => handleStringChange(e)}
							value={unitData.typeOfUnit}
							invalid={unitData.typeOfUnit != UnitType.suffix && unitData.suffix != ''}>
							{Object.keys(UnitType).map(key => {
								return (<option value={key} key={key} disabled={unitData.suffix != '' && key != UnitType.suffix}>
									{translate(`UnitType.${key}`)}</option>);
							})}
						</Input>
						<FormFeedback>
							<FormattedMessage id="unit.type.of.unit.suffix" />
						</FormFeedback>
					</FormGroup></Col>
					{/* Unit represent input */}
					<Col><FormGroup>
						<Label for='unitRepresent'>{translate('unit.represent')}</Label>
						<Input
							id='unitRepresent'
							name='unitRepresent'
							type='select'
							value={unitData.unitRepresent}
							disabled={inConversions()}
							onChange={e => handleStringChange(e)}>
							{Object.keys(UnitRepresentType).map(key => {
								return (<option value={key} key={key}>{translate(`UnitRepresentType.${key}`)}</option>);
							})}
						</Input>
					</FormGroup></Col>
				</Row>
				<Row xs='1' lg='2'>
					{/* Displayable type input */}
					<Col><FormGroup>
						<Label for='displayable'>{translate('displayable')}</Label>
						<Input
							id='displayable'
							name='displayable'
							type='select'
							value={unitData.displayable}
							onChange={e => handleStringChange(e)}
							invalid={unitData.displayable != DisplayableType.none && unitData.typeOfUnit == UnitType.meter}>
							{Object.keys(DisplayableType).map(key => {
								return (<option value={key} key={key} disabled={unitData.typeOfUnit == UnitType.meter && key != DisplayableType.none}>
									{translate(`DisplayableType.${key}`)}</option>);
							})}
						</Input>
						<FormFeedback>
							<FormattedMessage id="error.displayable.meter" />
						</FormFeedback>
					</FormGroup></Col>
					{/* Preferred display input */}
					<Col><FormGroup>
						<Label for='preferredDisplay'>{translate('unit.preferred.display')}</Label>
						<Input
							id='preferredDisplay'
							name='preferredDisplay'
							type='select'
							value={unitData.preferredDisplay.toString()}
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
							})}
						</Input>
					</FormGroup></Col>
				</Row>
				<Row xs='1' lg='2'>

					{/* Seconds in rate input */}
					<Col><FormGroup>
						<Label for='secInRate'>{translate('unit.sec.in.rate')}</Label>
						<Input
							id='secInRate'
							name='secInRate'
							type='number'
							defaultValue={unitData.secInRate}
							onChange={e => handleNumberChange(e)}
							placeholder='Sec In Rate'
							min='1'
							invalid={unitData.secInRate <= 0} />
						<FormFeedback>
							<FormattedMessage id="error.greater" values={{ min: '0' }} />
						</FormFeedback>
					</FormGroup></Col>
					{/* Suffix input */}
					<Col><FormGroup>
						<Label for='suffix'>{translate('unit.suffix')}</Label>
						<Input
							id='suffix'
							name='suffix'
							type='text'
							value={unitData.suffix}
							placeholder='Suffix'
							onChange={e => handleStringChange(e)}
							invalid={unitData.typeOfUnit === UnitType.suffix && unitData.suffix === ''} />
						<FormFeedback>
							<FormattedMessage id="error.required" />
						</FormFeedback>
					</FormGroup></Col>
				</Row>
				{/* Note input */}
				<FormGroup>
					<Label for='note'>{translate('unit')}</Label>
					<Input
						id='note'
						name='note'
						type='textarea'
						value={unitData.note}
						placeholder='Note'
						onChange={e => handleStringChange(e)} />
				</FormGroup>
			</Container></ModalBody>
			<ModalFooter>
				<Button variant="warning" color='danger' onClick={handleDeleteUnit}>
					<FormattedMessage id="unit.delete.unit" />
				</Button>
				{/* Hides the modal */}
				<Button color='secondary' onClick={handleClose}>
					<FormattedMessage id="discard.changes" />
				</Button>
				{/* On click calls the function handleSaveChanges in this component */}
				<Button color='primary' onClick={handleSaveChanges} disabled={!validUnit}>
					<FormattedMessage id="save.all" />
				</Button>
			</ModalFooter>
		</>
	);
}
