import * as React from 'react';
import { Modal } from 'reactstrap';
import EditConversionModalComponent from '../../components/conversion/EditConversionModalComponent';
import MapEditModalComponent from '../../components/maps/MapEditModalComponent';
import EditMeterModalComponent from '../../components/meters/EditMeterModalComponent';
import EditUnitModalComponent from '../../components/unit/EditUnitModalComponent';
import { useAdminEditModalHook } from '../../redux/componentHooks';
import { EntityType } from '../../redux/slices/localEditsSlice';

const AdminLocalEditsModal = () => {
	const { idToEdit, toggleAdminEditModal, adminEditModalIsOpen, typeToEdit } = useAdminEditModalHook();
	return (
		<Modal isOpen={adminEditModalIsOpen} toggle={toggleAdminEditModal} size='xl'>
			{/* Open the modal corresponding to the current page */}
			{typeToEdit === EntityType.METER && <EditMeterModalComponent meterId={idToEdit} />}
			{typeToEdit === EntityType.UNIT && <EditUnitModalComponent unitId={idToEdit} />}
			{typeToEdit === EntityType.MAP && <MapEditModalComponent id={idToEdit} />}
			{typeToEdit === EntityType.CONVERSION && <EditConversionModalComponent id={idToEdit} />}
		</Modal>
	);
};

export default AdminLocalEditsModal;