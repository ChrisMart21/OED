/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */
import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, Container, FormGroup, Input, Label, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { conversionsApi } from '../../redux/api/conversionsApi';
import { selectUnitDataById } from '../../redux/api/unitsApi';
import { useAdminEditModalHook, useLocalEditHook } from '../../redux/componentHooks';
import { useAppSelector } from '../../redux/reduxHooks';
import { EntityType } from '../../redux/slices/localEditsSlice';
import '../../styles/modal.css';
import { tooltipBaseStyle } from '../../styles/modalStyle';
import { TrueFalseType } from '../../types/items';
import translate from '../../utils/translate';
import { ConfirmActionModalBodyComponent } from '../ConfirmActionModalComponent';
import TooltipHelpComponent from '../TooltipHelpComponent';
import TooltipMarkerComponent from '../TooltipMarkerComponent';
import { selectConversionHeader } from './ConversionViewComponent';

interface EditConversionModalComponentProps {
	id: number;
}

/**
 * Defines the edit conversion modal form
 * @param props Props for the component
 * @returns Conversion edit element
 */
export default function EditConversionModalComponent(props: EditConversionModalComponentProps) {
	const [editConversion] = conversionsApi.useEditConversionMutation();
	const [deleteConversion] = conversionsApi.useDeleteConversionMutation();
	const unitDataById = useAppSelector(selectUnitDataById);
	const header = useAppSelector(state => selectConversionHeader(state, props.id));
	const {
		data,
		handlers: { handleStringChange, handleBooleanChange, handleNumberChange }
	} = useLocalEditHook(EntityType.CONVERSION, props.id);
	const { toggleAdminEditModal } = useAdminEditModalHook({ type: EntityType.CONVERSION, id: props.id });



	/* Confirm Delete Modal */
	// Separate from state comment to keep everything related to the warning confirmation modal together
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);
	const deleteConfirmationMessage = translate('conversion.delete.conversion') + ' [' + header + '] ?';
	const deleteConfirmText = translate('conversion.delete.conversion');
	const deleteRejectText = translate('cancel');
	// The first two handle functions below are required because only one Modal can be open at a time (properly)
	const handleDeleteConfirmationModalClose = () => {
		// Hide the warning modal
		setShowDeleteConfirmationModal(false);
		// Show the edit modal
		// openAdminEditModal();
	};
	const handleDeleteConfirmationModalOpen = () => {
		// Hide the edit modal
		// toggleAdminEditModal();
		// Show the warning modal
		setShowDeleteConfirmationModal(true);
	};
	const handleDeleteConversion = () => {
		// Closes the warning modal
		// Do not call the handler function because we do not want to open the parent modal
		setShowDeleteConfirmationModal(false);

		// Delete the conversion using the state object, it should only require the source and destination ids set
		deleteConversion({ sourceId: data.sourceId, destinationId: data.destinationId });

	};
	/* End Confirm Delete Modal */


	// Save changes
	// Currently using the old functionality which is to compare inherited prop values to state values
	// If there is a difference between props and state, then a change was made
	// Side note, we could probably just set a boolean when any input i
	// Edit Conversion Validation: is not needed as no breaking edits can be made
	const handleSaveChanges = () => {
		// Close the modal first to avoid repeat clicks
		toggleAdminEditModal();

		// Need to redo Cik if slope, intercept, or bidirectional changes.
		const shouldRedoCik = data.slope !== data.slope
			|| data.intercept !== data.intercept
			|| data.bidirectional !== data.bidirectional;
		// Check for changes by comparing state to props
		const conversionHasChanges = shouldRedoCik || data.note != data.note;
		// Only do work if there are changes
		if (conversionHasChanges) {
			// Save our changes
			editConversion({ conversionData: data, shouldRedoCik });
		}
	};

	const tooltipStyle = {
		...tooltipBaseStyle,
		tooltipEditConversionView: 'help.admin.conversionedit'
	};

	return showDeleteConfirmationModal ?
		<ConfirmActionModalBodyComponent
			// show={showDeleteConfirmationModal}
			actionConfirmMessage={deleteConfirmationMessage}
			handleClose={handleDeleteConfirmationModalClose}
			actionFunction={handleDeleteConversion}
			actionConfirmText={deleteConfirmText}
			actionRejectText={deleteRejectText} />
		:
		<>
			<ModalHeader>
				<FormattedMessage id="conversion.edit.conversion" />
				<TooltipHelpComponent page='conversions-edit' />
				<div style={tooltipStyle}>
					<TooltipMarkerComponent page='conversions-edit' helpTextId={tooltipStyle.tooltipEditConversionView} />
				</div>
			</ModalHeader>
			{/* // when any of the conversion are changed call one of the functions. */}
			<ModalBody>
				<Container>
					<Row xs='1' lg='2'>
						<Col>
							{/* Source unit - display only */}
							<FormGroup>
								<Label for='sourceId'>{translate('conversion.source')}</Label>
								<Input
									id='sourceId'
									name='sourceId'
									type='text'
									defaultValue={unitDataById[data.sourceId]?.identifier}
									// Disable input to prevent changing ID value
									disabled>
								</Input>
							</FormGroup>
						</Col>
						<Col>
							{/* Destination unit - display only */}
							<FormGroup>
								<Label for='destinationId'>{translate('conversion.destination')}</Label>
								<Input
									id='destinationId'
									name='destinationId'
									type='text'
									defaultValue={unitDataById[data.destinationId]?.identifier}
									// Disable input to prevent changing ID value
									disabled>
								</Input>
							</FormGroup>
						</Col>
					</Row>
					{/* Bidirectional Y/N input */}
					<FormGroup>
						<Label for='bidirectional'>{translate('conversion.bidirectional')}</Label>
						<Input
							id='bidirectional'
							name='bidirectional'
							type='select'
							defaultValue={data.bidirectional.toString()}
							onChange={e => handleBooleanChange(e)}>
							{Object.keys(TrueFalseType).map(key => {
								return (<option value={key} key={key}>{translate(`TrueFalseType.${key}`)}</option>);
							})}
						</Input>
					</FormGroup>
					<Row xs='1' lg='2'>
						<Col>
							{/* Slope input */}
							<FormGroup>
								<Label for='slope'>{translate('conversion.slope')}</Label>
								<Input
									id='slope'
									name='slope'
									type='number'
									value={data.slope}
									onChange={e => handleNumberChange(e)} />
							</FormGroup>
						</Col>
						<Col>
							{/* Intercept input */}
							<FormGroup>
								<Label for='intercept'>{translate('conversion.intercept')}</Label>
								<Input
									id='intercept'
									name='intercept'
									type='number'
									value={data.intercept}
									onChange={e => handleNumberChange(e)} />
							</FormGroup>
						</Col>
					</Row>
					{/* Note input */}
					<FormGroup>
						<Label for='note'>{translate('note')}</Label>
						<Input
							id='note'
							name='note'
							type='textarea'
							defaultValue={data.note}
							placeholder='Note'
							onChange={e => handleStringChange(e)} />
					</FormGroup>
				</Container>
			</ModalBody>
			<ModalFooter>
				<Button color='danger' onClick={handleDeleteConfirmationModalOpen}>
					<FormattedMessage id="conversion.delete.conversion" />
				</Button>
				{/* Hides the modal */}
				<Button color='secondary' onClick={toggleAdminEditModal}>
					<FormattedMessage id="discard.changes" />
				</Button>
				{/* On click calls the function handleSaveChanges in this component */}
				<Button color='primary' onClick={handleSaveChanges}>
					<FormattedMessage id="save.all" />
				</Button>
			</ModalFooter>
		</>;
}
