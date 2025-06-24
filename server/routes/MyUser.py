from flask import request
from setup import Resource, jwt_required, check_user_exists, db
from models.User import User


class MyUser(Resource):
    """
    Resource for retrieving and updating the current user's information.
    Provides endpoints to get, update user details and toggle client bookmarks.
    """
    
    # Fields to return in GET response
    USER_FIELDS = (
        "id", "username",
    )
    
    @jwt_required()
    @check_user_exists
    def get(self, user):
        """
        Get the current authenticated user's details.
        
        Args:
            user: User object (injected by check_user_exists decorator)
            
        Returns:
            200: User details
        """
        # Return user details
        return user.to_dict(only=self.USER_FIELDS), 200
        
