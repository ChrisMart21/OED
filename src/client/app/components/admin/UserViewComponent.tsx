/* eslint-disable no-mixed-spaces-and-tabs */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button, Input } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import { User, UserRole } from '../../types/items';
import '../../styles/card-page.css';
import { useState } from 'react';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';

interface UserViewComponentProps {
	 user: User;
	 editUser: (e: React.ChangeEvent<HTMLInputElement>, user: User) => void;
	 deleteUser: (email: string) => void;
}

const UserViewComponent: React.FC<UserViewComponentProps> = ({ user, editUser, deleteUser }) => {
	const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

	const handleDeleteConfirmation = () => {
	  setShowDeleteConfirmation(true);
	};

	const handleDeleteConfirm = () => {
	  deleteUser(user.email);
	  setShowDeleteConfirmation(false);
	};

	const handleDeleteCancel = () => {
	  setShowDeleteConfirmation(false);
	};

	const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
	  editUser(e, user);
	};

	 return (
		<>
		  <ConfirmActionModalComponent
				show={showDeleteConfirmation}
				actionConfirmMessage={`Are you sure you want to delete user ${user.email}?`}
				handleClose={handleDeleteCancel}
				actionFunction={handleDeleteConfirm}
				actionConfirmText="Delete User"
				actionRejectText="Cancel"
		  />
		 <div className="card">
			 <div className="identifier-container">
				 {user.email}
			 </div>
			 <div className="item-container">
				 <b><FormattedMessage id="role" /></b>
					<Input
					 type='select'
					 value={user.role}
					 onChange={handleRoleChange}
				 >
					 {Object.entries(UserRole).map(([role, val]) => (
						 <option value={val} key={role}> {role} </option>
					 ))}
					</Input>
			 </div>
			 <div className="edit-btn">
				 <Button color='danger' onClick={handleDeleteConfirmation}>
					 <FormattedMessage id="delete.user" />
				 </Button>
			 </div>
		 </div>
		 </>
	 );
};

export default UserViewComponent;
