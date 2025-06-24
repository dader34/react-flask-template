from setup import (
    Resource,
    db,
    request,
    get_jwt_identity,
    jwt_required,
    check_user_exists,
    patch_if_exists
)
from models.User import User


class UserById(Resource):
    """
    Resource for managing individual user operations by ID.
    Provides endpoints to retrieve, update, and delete users.
    """
    
    # Updated list of fields to be returned in GET response
    USER_FIELDS = (
        "id", "username", "email", "status", 
        "last_name", "first_name", "start_date", 'locked', 'login_attempts'
    )

    @jwt_required()
    @check_user_exists
    def get(self, current_user, id):
        """
        Get user details by ID.
        
        Args:
            current_user: User object (injected by check_user_exists decorator)
            id: User ID to retrieve
            
        Returns:
            200: User details
            404: User not found
        """
        user = db.session.get(User, id)
        if not user:
            return {"error": "User not found"}, 404
            
        return user.to_dict(only=self.USER_FIELDS), 200

    @jwt_required()
    @check_user_exists
    def patch(self, current_user, id):
        """
        Update user details by ID.
        
        Args:
            current_user: User object (injected by check_user_exists decorator)
            id: User ID to update
            
        Returns:
            200: Success
            400: Invalid request or user not found
        """
            
        if not id:
            return {"error": "Invalid arguments"}, 400

        user = db.session.get(User, id)
        if not user:
            return {"error": "User not found"}, 404

        try:
            self._update_user(user, current_user, request.json)
            return {"success": "User successfully updated"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400

    @jwt_required()
    def delete(self, id):
        """
        Delete user by ID. Restricted to users with can_edit_users permission.
        
        Args:
            id: User ID to delete
            
        Returns:
            204: Success (no content)
            404: User not found
        """
        # Get the user to delete
        user = db.session.get(User, id)
        if not user:
            return {"error": "User not found"}, 404

        # Verify current user exists and has permission
        current_user = db.session.get(User, get_jwt_identity())
        if not current_user:
            return {"error": "Current user not found"}, 404
            

        try:
            # Log activity and delete the user
            db.session.delete(user)
            db.session.commit()
            return {}, 204
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 400
            
    def patch_if_exists(self, keys, data, model):
        """
        Update model attributes if they exist in the data dictionary.
        
        Args:
            keys: List of keys to check and update
            data: Dictionary containing update data
            model: Model object to update
        """
        for key in keys:
            if key in data and data[key] is not None:
                setattr(model, key, data[key])
    
    def _update_user(self, user, current_user, data):
        """
        Helper method to update user details.
        
        Args:
            user: User object to update
            current_user: Current authenticated user
            data: Update data dictionary
            
        Raises:
            Exception: If update fails
        """
        # Update basic user fields if provided
        user_fields = [
            "username", "email", "status", "start_date", 
            "first_name", "last_name"
        ]
        patch_if_exists(user_fields, data, user)
        
        # Handle account locking
        if 'locked' in data:
            user.locked = data['locked']
            if not data['locked']:  # If unlocking, reset login attempts
                user.login_attempts = 0
            
        # Handle password update
        if 'password' in data and len(data['password']) >= 5:
            user.password = data['password']

        
        # Commit the changes
        db.session.commit()