import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { Modal } from 'reactstrap';
import MapEditModalComponent from '../../components/maps/MapEditModalComponent';
import EditMeterModalComponent from '../../components/meters/EditMeterModalComponent';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectIdToEdit, selectIsOpen, toggleIsOpen } from '../../redux/slices/localEditsSlice';

const AdminLocalEditsModal = () => {
	const dispatch = useAppDispatch();
	const isOpen = useAppSelector(selectIsOpen);
	const idToEdit = useAppSelector(selectIdToEdit);
	const { pathname } = useLocation();
	const toggle = React.useCallback(() => dispatch(toggleIsOpen()), []);
	return (
		<Modal isOpen={isOpen} toggle={toggle} size='xl'>
			{/* Open the modal corresponding to the current page */}
			{pathname === '/meters/admin' && <EditMeterModalComponent meterId={idToEdit} />}
			{pathname === '/maps' && <MapEditModalComponent />}
		</Modal>
	);
};

export default AdminLocalEditsModal;