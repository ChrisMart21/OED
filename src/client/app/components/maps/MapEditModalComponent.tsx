import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Col, FormGroup, Input, Label, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { useLocalEditHook, useTranslate } from '../../redux/componentHooks';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { EntityType, selectIdToEdit, toggleIsOpen } from '../../redux/slices/localEditsSlice';


const MapEditModalComponent = () => {
	const dispatch = useAppDispatch();
	const translate = useTranslate();
	const toggleModal = React.useCallback(() => dispatch(toggleIsOpen()), []);
	const idToEdit = useAppSelector(selectIdToEdit);
	const {
		data: mapData,
		handlers: {
			handleNumberChange,
			handleStringChange
		}
	} = useLocalEditHook(EntityType.MAP, idToEdit);
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