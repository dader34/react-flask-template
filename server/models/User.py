from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates
from sqlalchemy.ext.hybrid import hybrid_property
import base64

from setup import db, bcrypt, current_time

class User(db.Model, SerializerMixin):
    """
    Model representing user accounts in the system.
    """

    __tablename__ = "users"

    # Primary fields
    id = db.Column(db.String, primary_key=True)
    username = db.Column(db.String, nullable=False, unique=True)
    password_hash = db.Column(db.String, nullable=False)
    login_attempts = db.Column(db.Integer, default=0)

    # User information
    first_name = db.Column(db.String)
    last_name = db.Column(db.String)
    email = db.Column(db.String)

    # Status and role
    status = db.Column(db.String, default="Active")
    locked = db.Column(db.Boolean, default=False)

    # Timestamps
    created_at = db.Column(db.String, default=current_time, nullable=False)
    last_login = db.Column(db.String, default=current_time)
    start_date = db.Column(db.String)

    # Password handling
    @hybrid_property
    def password(self):
        """
        Password getter property - returns the hashed password.

        Returns:
            str: Hashed password
        """
        return self.password_hash

    @password.setter
    def password(self, password):
        """
        Password setter - hashes and stores the password.

        Args:
            password (str): Plain text password to hash and store
        """
        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
        self.password_hash = base64.b64encode(hashed_password).decode("utf-8")
        

    def authenticate(self, password):
        """
        Verify if the provided password matches the stored hash.

        Args:
            password (str): Plain text password to check

        Returns:
            bool: True if password matches, False otherwise
        """
        # print(f"Username: {self.username}")
        # print(f"Input password: {password}")
        # print(f"Stored hash type before decode: {type(self.password_hash)}")

        try:
            hashed_password = base64.b64decode(self.password_hash.encode("utf-8"))
            # print(f"Decoded hash: {hashed_password}")
            # print(f"Decoded hash type: {type(hashed_password)}")
            # print(f"Password bytes: {password.encode('utf-8')}")

            # Check if the hash follows bcrypt format (starts with $2b$)
            # if not hashed_password.startswith(b'$2b$'):
            # print("WARNING: Hash doesn't appear to be in proper bcrypt format")

            result = bcrypt.checkpw(password.encode("utf-8"), hashed_password)
            # print(f"Authentication result: {result}")
        except Exception as e:
            print(f"Exception during authentication: {e}")
            return False

        if not result:
            if self.login_attempts is not None and self.login_attempts >= 5:
                self.locked = True
            else:
                self.login_attempts = (
                    self.login_attempts + 1 if self.login_attempts is not None else 1
                )
        else:
            self.login_attempts = 0

        try:
            db.session.commit()
        except Exception as e:
            print(f"Database error: {e}")
            return {"error": "An error occurred while authenticating"}, 400

        return result
    

    # Validations
    @validates("username")
    def validate_username(self, key, username):
        """
        Validate username length and uniqueness.

        Args:
            key (str): Field name being validated
            username (str): Username to validate

        Returns:
            str: Validated username

        Raises:
            ValueError: If username is too short or already taken
        """
        if len(username) < 5:
            raise ValueError("Username must be at least 5 characters long.")

        existing_user = User.query.filter_by(username=username).first()
        if existing_user and existing_user.id != self.id:
            raise ValueError("Username is taken.")

        return username

    @validates("password")
    def validate_password(self, key, password):
        """
        Validate password length.

        Args:
            key (str): Field name being validated
            password (str): Password to validate

        Returns:
            str: Validated password

        Raises:
            ValueError: If password is too short
        """
        if len(password) < 5:
            raise ValueError("Password must be at least 5 characters long.")
        return password

        return role_id

    @validates("email")
    def validate_email(self, key, email):
        """
        Validate email uniqueness.

        Args:
            key (str): Field name being validated
            email (str): Email to validate

        Returns:
            str: Validated email

        Raises:
            ValueError: If email is already taken
        """
        if email:  # Only validate if an email is provided (allows for None/empty)
            existing_user = User.query.filter_by(email=email).first()
            if existing_user and existing_user.id != self.id:
                raise ValueError("Email address is already in use.")

        return email