import * as React from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { useAppDispatch, useAppSelector } from '../../redux/reduxHooks';
import { selectMapMetaData } from '../../redux/selectors/mapsSelectors';
import { EntityType } from '../../redux/slices/localEditsSlice';

const AdminModalComponent = (props: {
	id: number;
	modalState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}) => {
	const [isOpen, setIsOpen] = props.modalState;
	const toggle = () => setIsOpen(open => !open);
	const mapData = useAppSelector(state => selectMapMetaData(state, props.id));
	const dispatch = useAppDispatch();
	return (
		mapData &&
		<Modal isOpen={isOpen} toggle={toggle} size='xl'>
			<ModalHeader toggle={toggle}>{mapData.name}</ModalHeader>
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
				<Button color="primary" onClick={()=> mapData && dispatch(setEdit({
					type: EntityType.MAP, changes: mapData,
				}))}>
					Do Something
				</Button>{' '}
				<Button color="secondary" onClick={toggle}>
					Cancel
				</Button>
			</ModalFooter>
		</Modal>
	);
};

export default AdminModalComponent;