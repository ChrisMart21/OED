import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import TooltipHelpComponent from '../../components/TooltipHelpComponent';
import { useAppDispatch } from '../../redux/reduxHooks';
import { toggleIsOpen } from '../../redux/slices/localEditsSlice';


const MapEditModalComponent = () => {
	const dispatch = useAppDispatch();
	const toggleModal = React.useCallback(() => dispatch(toggleIsOpen()), []);

	return (
		<>
			<ModalHeader toggle={toggleModal}>
				<FormattedMessage id="edit.meter" />
				<TooltipHelpComponent page='meters-edit' />
			</ModalHeader>
			<ModalBody>
				{/* <Row xs='1' lg='2'>
					<Col><FormGroup>
						<Label for='reading'>{translate('meter.reading')}</Label>
						<Input
							id='reading'
							name='reading'
							type='number'
							onChange={e => handleNumberChange(e)}
							defaultValue={displayData?.reading} />
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
							value={displayData?.startTimestamp} />
					</FormGroup></Col>
				</Row> */}
			</ModalBody>
			<ModalFooter>
				Hello, Footer!
			</ModalFooter>
		</>
	);
};


export default MapEditModalComponent;