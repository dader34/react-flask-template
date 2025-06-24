from setup import (
    Resource,
    db,
    request,
    jwt_required,
    check_not_none,
    resend,
    load_dotenv,
    os,
)
from models.User import User
from models.AuthCode import AuthCode


class ResetPassword(Resource):
    """
    Resource for handling password reset functionality.
    Provides endpoints to send reset emails and process reset requests.
    """

    def post(self, reset_code):
        """
        Handle password reset requests.

        Args:
            reset_code: Reset code or "send" to request a new code

        JSON Body:
            email: User email (for reset code request)
            password: New password (for password reset)

        Returns:
            200: Success
            400: Invalid request
            404: User not found
            500: Server error
        """

        if reset_code == "send":
            return self._send_reset_email()
        else:
            return self._process_reset(reset_code)

    def _send_reset_email(self):
        """
        Send password reset email to user.

        Returns:
            200: Success
            400: Missing email
            404: User not found
            500: Server error
        """
        email = request.json.get("email")

        if not check_not_none(email):
            return {"error": "Please include an email"}, 400

        try:
            user_account = User.query.filter(
                db.func.lower(User.email) == db.func.lower(email)
            ).first()

            if not user_account:
                return {"error": "User with that email does not exist"}, 404

            # Create reset code
            reset_link = AuthCode(email=user_account.email)
            db.session.add(reset_link)


            db.session.commit()

            # Load environment variables
            load_dotenv()
            PROD = os.environ.get("PROD")

            # Build reset URL
            base_url = "http://127.0.0.1:3000"
            reset_url = f"{base_url}/reset_password/{reset_link.id}"

            html_template = """ 
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Password Reset</title>
                <style>
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                        background-color: #f8f9fa;
                    }
                    .container {
                        background: white;
                        padding: 40px;
                        border-radius: 8px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #2c3e50;
                        margin: 0;
                        font-size: 24px;
                    }
                    .content {
                        margin-bottom: 30px;
                    }
                    .reset-button {
                        display: inline-block;
                        background-color: #3498db;
                        color: white !important;
                        padding: 12px 30px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: 500;
                        text-align: center;
                        margin: 20px 0;
                        transition: background-color 0.3s ease;
                    }
                    .reset-button:hover {
                        background-color: #2980b9;
                    }
                    .footer {
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #eee;
                        font-size: 14px;
                        color: #666;
                    }
                    .security-note {
                        background-color: #fff3cd;
                        border: 1px solid #ffeaa7;
                        border-radius: 4px;
                        padding: 15px;
                        margin: 20px 0;
                        font-size: 14px;
                    }
                    @media (max-width: 600px) {
                        body {
                            padding: 10px;
                        }
                        .container {
                            padding: 20px;
                        }
                    }
                </style>
            </head>
            """ + f"""
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Password Reset Request</h1>
                    </div>
                    
                    <div class="content">
                        <p>Hello,</p>
                        
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        
                        <div style="text-align: center;">
                            <a href='{reset_url}' class="reset-button">Reset My Password</a>
                        </div>
                        
                        <div class="security-note">
                            <strong>⚠️ Security Notice:</strong> This link will expire shortly for your security. If you didn't request this password reset, please ignore this email.
                        </div>
                        
                        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                        <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">{reset_url}</p>
                    </div>
                    
                    <div class="footer">
                        <p>If you're having trouble, please contact our support team.</p>
                        <p>Best regards,<br>Your Security Team</p>
                    </div>
                </div>
            </body>
            </html>
            """

            # Send email
            params = {
                "from": "Admin <Administrator@templatesite.app>",
                "to": [user_account.email],
                "subject": "Template Site Password Reset",
                "html": html_template,
            }
            resend.Emails.send(params)

            return {"success": True}, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500

    def _process_reset(self, reset_code):
        """
        Process password reset request with provided code.

        Args:
            reset_code: Reset code to validate

        Returns:
            200: Success
            400: Invalid request or expired code
            500: Server error
        """
        password = request.json.get("password")

        if not check_not_none(password):
            return {"error": "Please include a password"}, 400

        try:
            reset = db.session.get(AuthCode, reset_code)

            if not reset:
                return {"error": "Invalid reset code"}, 400

            if reset.is_expired:
                return {"error": "Your auth code has expired"}, 400

            user_account = User.query.filter(
                db.func.lower(User.email) == db.func.lower(reset.email)
            ).first()

            if not user_account:
                return {"error": "User not found"}, 404

            # Update password
            user_account.password = password



            # Remove the used reset code
            db.session.delete(reset)
            db.session.commit()

            return {"success": True}, 200

        except Exception as e:
            db.session.rollback()
            return {"error": str(e)}, 500
