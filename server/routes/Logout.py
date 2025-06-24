from setup import Resource, make_response, unset_access_cookies, unset_refresh_cookies, jwt_required, get_jwt_identity
from models.User import User
from setup import db, check_user_exists


class Logout(Resource):
    """
    Resource for handling user logout.
    Provides an endpoint to log out the authenticated user.
    """
    
    @jwt_required()
    @check_user_exists
    def delete(self, user):
        """
        Log out the current authenticated user by clearing cookies.
        
        Returns:
            204: No content with cleared cookies
        """
        try:
            
            # Create response and clear cookies
            response = make_response({}, 204)
            unset_access_cookies(response)
            unset_refresh_cookies(response)
            
            return response
            
        except Exception as e:
            # If there's an error during logout, still clear cookies
            # but return a 200 status code with error info
            response = make_response({"error": str(e)}, 200)
            unset_access_cookies(response)
            unset_refresh_cookies(response)
            
            return response