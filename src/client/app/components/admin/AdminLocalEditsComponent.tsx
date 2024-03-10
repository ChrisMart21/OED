import * as React from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectIdToEdit, selectIsOpen, toggleIsOpen } from '../../redux/slices/localEditsSlice';
import { selectMapMetaData } from '../../redux/selectors/mapsSelectors';

const AdminLocalEditsComponent = () => {
	const dispatch = useAppDispatch();
	const isOpen = useAppSelector(selectIsOpen);
	const idToEdit = useAppSelector(selectIdToEdit);
	const mapData = useAppSelector(state => selectMapMetaData(state, idToEdit));
	const toggle = React.useCallback(() => dispatch(toggleIsOpen()), []);
	console.log('idToEdit', idToEdit,'mapData', mapData);
	return (
		// mapData &&
		<Modal isOpen={isOpen} toggle={toggle} size='xl'>
			<ModalHeader toggle={toggle}>Hello,Modal!</ModalHeader>
			<ModalBody>
				Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do
				eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
				minim veniam, quis nostrud exercitation ullamco laboris nisi ut
				aliquip ex ea commodo consequat. Duis aute irure dolor in
				reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
				pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
				culpa qui officia deserunt mollit anim id est laborum.
			</ModalBody>
			<ModalFooter>
				{/* <Button color="primary"
					onClick={() => mapData && dispatch(
						setEdits({ type: EntityType.MAP, data: mapData }))
					}
				>
					Do Something
				</Button> */}
				<Button color="secondary" onClick={toggle}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default AdminLocalEditsComponent;