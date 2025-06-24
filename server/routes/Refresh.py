from setup import db, Resource, make_response, create_access_token, jwt_required, set_access_cookies, get_jwt_identity, check_user_exists
from models.User import User


class RefreshToken(Resource):
    """
    Resource for handling token refresh operations.
    Provides an endpoint to refresh the user's access token.
    """
    
    @jwt_required(refresh=True)
    @check_user_exists
    def post(self, user):
        """
        Refresh the user's access token using their refresh token.
        
        Args:
            user: User object (injected by check_user_exists decorator)
            
        Returns:
            200: User details with new access token in cookies
            500: Server error
        """
        try:
            # Create a new access token
            new_access_token = create_access_token(identity=user.id)
            
            # Create response with user details
            response = make_response(
                user.to_dict(only=('id', 'username',)), 
                200
            )
            
            # Set the new access token in cookies
            set_access_cookies(response, new_access_token)
            
            
            return response
            
        except Exception as e:
            # Log the error but don't expose details to client
            db.session.rollback()
            return {"error": str(e)}, 500