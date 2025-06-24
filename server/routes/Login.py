from setup import (
    Resource,
    db,
    request,
    make_response,
    timedelta,
    create_access_token,
    create_refresh_token,
    set_access_cookies,
    set_refresh_cookies,
    resend,
    check_not_none,
    BYPASS_2FA,
    PROD,
    current_time,
    load_dotenv,
    datetime,
)
from models.User import User
from models.AuthCode import AuthCode



class Login(Resource):
    """
    Resource for handling user login.
    Provides endpoints for login with optional 2FA.
    """

    def post(self):
        """
        Process login request with username/password or 2FA code.

        JSON Body:
            username: User's username
            password: User's password
            2fa_code: (Optional) 2FA code for second step of authentication

        Returns:
            200: User details with access and refresh tokens as cookies
            400: Invalid request or authentication error
            404: User not found
            500: Server error during 2FA processing
        """
        load_dotenv()

        # Check if this is a 2FA code validation request
        _2fa_code = request.json.get("2fa_code")
        if check_not_none(_2fa_code):
            return self._validate_2fa_code(_2fa_code)

        # Otherwise, process initial login request
        username = request.json.get("username")
        password = request.json.get("password")

        # Validate username and password
        if not username or not password:
            return {"error": "Username and password are required"}, 400

        if not (5 <= len(username) <= 25 and 5 <= len(password) <= 25):
            return {
                "error": "Username and password must be between 5 and 25 characters"
            }, 400

        # Lookup user by username (case-insensitive)
        user = User.query.filter(
            db.func.lower(User.username) == db.func.lower(username)
        ).first()

        if not user:
            return {"error": "User not found"}, 404

        if user.locked:
            return {"error": "Account is locked"}, 400

        # Verify password
        if not user.authenticate(password):
            return {"error": "Invalid password"}, 400
        
        user.last_login = current_time()

        # Check if 2FA can be bypassed (development only)
        if not PROD:
            # Reset rate limit on successful login
            return self._complete_login(user)

        # Process 2FA if user has email
        if user.email:
            # Reset initial login rate limit since credentials were valid
            return self._send_2fa_code(user)
        else:
            return {
                "error": "Your account does not have an email associated with it, please set your email."
            }, 400

    def _validate_2fa_code(self, code):
        """
        Validate a 2FA code and complete the login if valid.

        Args:
            code: 2FA code to validate

        Returns:
            200: User details with access/refresh tokens
            400: Invalid or expired code
            429: Rate limit exceeded
        """

        auth_code = db.session.get(AuthCode, code)
        if not auth_code:
            return {"error": "Invalid 2FA code"}, 400

        if auth_code.is_expired:
            return {"error": "Your auth code has expired"}, 400

        # Get the user associated with the code
        user = auth_code.user

        # Delete the used auth code
        db.session.delete(auth_code)
        db.session.commit()

        # Complete the login process
        return self._complete_login(user)

    def _send_2fa_code(self, user):
        """
        Generate and send a 2FA code to the user's email.

        Args:
            user: User object to send 2FA code to

        Returns:
            200: Success message
            429: Rate limit exceeded
            500: Error sending email
        """

        try:
            # Delete all pre-existing 2FA codes for this user
            for code in AuthCode.query.filter(AuthCode.email == user.email).all():
                db.session.delete(code)

            # Create a new 2FA code
            new_2fa_code = AuthCode(email=user.email)
            db.session.add(new_2fa_code)
            db.session.commit()

            # Send the code via email
            params = {
                "from": "Admin <Administrator@templatesite.app>",
                "to": [user.email],
                "subject": "2FA Code",
                "html": f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #4a6cf7;">Template Site Authentication</h2>
                </div>
                
                <p style="margin-bottom: 25px;">Hello {user.username},</p>
                
                <p style="margin-bottom: 30px;">We received a request to log in to your account. Please use the verification code below to complete your login:</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 5px; padding: 20px; text-align: center; font-size: 28px; letter-spacing: 5px; margin: 30px 0; font-weight: bold;">
                    {new_2fa_code.id}
                </div>
                
                <p style="margin-top: 30px;">This code will expire in 10 minutes. If you did not request this code, please ignore this email or contact support if you have concerns.</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #64748b; text-align: center;">
                    <p>This is an automated message from Template Site. Please do not reply to this email.</p>
                    <p>&copy; {datetime.now().year} Template Site. All rights reserved.</p>
                </div>
            </div>
            """,
            }
            resend.Emails.send(params)

            return {"success": "2FA"}, 200
        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def _complete_login(self, user):
        """
        Complete the login process by creating tokens and logging the activity.

        Args:
            user: User object to log in

        Returns:
            200: User details with access/refresh tokens
        """
        # Create access and refresh tokens
        access_token = create_access_token(
            identity=user.id,
            expires_delta=timedelta(hours=1),
        )
        refresh_token = create_refresh_token(
            identity=user.id,
            expires_delta=timedelta(days=30),
        )

        # Create response with user details
        response = make_response(
            user.to_dict(
                only=(
                    "id",
                    "username",
                )
            ),
            200,
        )

        # Set auth cookies
        set_access_cookies(response, access_token)
        set_refresh_cookies(response, refresh_token)


        return response