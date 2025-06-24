from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates
from setup import db, generate_unique_uuid, current_time, timedelta, datetime
from sqlalchemy.ext.hybrid import hybrid_property
from models.User import User

class AuthCode(db.Model, SerializerMixin):
    __tablename__ = 'auth_codes'

    id = db.Column(db.String, primary_key=True, default=lambda: generate_unique_uuid(AuthCode))

    email = db.Column(db.String, nullable=False)
    
    created_at = db.Column(db.String, default=current_time, nullable=False)

    @hybrid_property
    def user(self):
        if found := User.query.filter(
                        db.func.lower(User.email) == db.func.lower(self.email)
                    ).first():
            return found
        else:
            return None
        
    @hybrid_property
    def is_expired(self):
        # Expires in 5 minutes
        from datetime import datetime, timedelta
        import re
        
        try:
            # Handle the timezone format issue
            created_at_str = str(self.created_at)
            
            # Fix timezone format: convert '-07' to '-07:00' if needed
            # This regex matches timezone formats like '-07', '+05', etc. and converts them
            created_at_str = re.sub(r'([+-]\d{2})$', r'\1:00', created_at_str)
            
            # Parse the corrected datetime string
            created_at_dt = datetime.fromisoformat(created_at_str)
            
            # Calculate expiration time
            expiration_time = created_at_dt + timedelta(minutes=5)
            
            # Compare with current time
            return current_time() > expiration_time
            
        except (ValueError, TypeError) as e:
            # If parsing fails, treat as expired for security
            print(f"Error parsing created_at: {e}")
            return True