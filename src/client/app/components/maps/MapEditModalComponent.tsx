import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Col, FormGroup, Input, Label, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { EntityType, selectEditedMapById, selectIdToEdit, toggleIsOpen } from '../../redux/slices/localEditsSlice';
import { selectMapById } from '../../redux/api/mapsApi';
import { useLocalEditHandlers, useTranslate } from '../../redux/componentHooks';


const MapEditModalComponent = () => {
	const dispatch = useAppDispatch();
	const translate = useTranslate();
	const toggleModal = React.useCallback(() => dispatch(toggleIsOpen()), []);
	// use edited maps if they exist, otherwise use the original map data
	const mapData = useAppSelector(state => selectEditedMapById(state, selectIdToEdit(state)) ?? selectMapById(state, selectIdToEdit(state)));
	const {
		handleNumberChange,
		handleStringChange
	} = useLocalEditHandlers({ type: EntityType.MAP, data: mapData });
	return (
		<>
			<ModalHeader toggle={toggleModal}>
				{`${translate('edit')} - ${mapData?.name}`}
				<FormattedMessage id="edit.meter" />
				<TooltipHelpComponent page='meters-edit' />
			</ModalHeader>
			<ModalBody>
				<Row xs='1' lg='2'>
					<Col><FormGroup>
						<Label for='reading'>{translate('meter.reading')}</Label>
						<Input
							id='reading'
							name='reading'
							type='number'
							onChange={handleNumberChange}
						// defaultValue={displayData?.reading}
						/>
					</FormGroup></Col>
					<Col><FormGroup>
						<Label for='startTimestamp'>{translate('meter.startTimeStamp')}</Label>
						<Input
							id='startTimestamp'
							name='startTimestamp'
							type='text'
							autoComplete='on'
							onChange={e => handleStringChange(e)}
							placeholder='YYYY-MM-DD HH:MM:SS'
						// value={displayData?.startTimestamp}
						/>
					</FormGroup></Col>
				</Row>
			</ModalBody>
			<ModalFooter>
				Hello, Footer!
			</ModalFooter>
		</>
	);
};


export default MapEditModalComponent;