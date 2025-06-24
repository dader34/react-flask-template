"""
Flask Application for ClockwiseCPA - Enhanced Dashboard
"""

import os
import time
import uuid
import bcrypt
import psutil
import platform
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict
import threading
import re

# Third-party imports
import pytz
import resend
from dotenv import load_dotenv
from sqlalchemy import create_engine, MetaData, text, func


# Flask imports
from flask import Flask, render_template, request, make_response, jsonify, redirect, url_for
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, jwt_required, get_jwt_identity, 
    unset_access_cookies, unset_refresh_cookies, 
    create_access_token, create_refresh_token, 
    set_access_cookies, set_refresh_cookies, get_jwt, verify_jwt_in_request
)
from flask_migrate import Migrate
from flask_restful import Api, Resource
from flask_sqlalchemy import SQLAlchemy


# ------------------------
# Application Configuration
# ------------------------

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Environment variables
PROD = os.environ.get('PROD')
DB_URL = os.environ.get("POSTGRES_URL")
RESEND_API_KEY = os.environ.get('RESEND_API_KEY')
BYPASS_2FA = os.environ.get('BYPASS_2FA')
TEST_DB_URL = os.environ.get('TEST_DB_URL')

# Database configuration
app.config["SQLALCHEMY_DATABASE_URI"] = TEST_DB_URL
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {'pool_pre_ping': True}

# JWT configuration - updated for dashboard auth
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['PROPAGATE_EXCEPTIONS'] = True
app.config['JWT_COOKIE_SECURE'] = True
app.config['JWT_SECRET_KEY'] = os.environ.get("KEY")
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(weeks=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(weeks=3)

# Development vs Production JWT settings
if PROD:
    app.config['JWT_COOKIE_SAMESITE'] = 'None'
    app.config['JWT_COOKIE_DOMAIN'] = ".clockwisecpa.app"
    app.config["SQLALCHEMY_DATABASE_URI"] = DB_URL

# Start time of the application
start_time = datetime.now()

# ------------------------
# Extensions Initialization
# ------------------------

# Enable CORS
cors = CORS(app, 
    supports_credentials=True,
    # origins='*',
    origins=['http://localhost:3000', 'http://127.0.0.1:3001','http://127.0.0.1:3000','http://localhost:3001'],
    allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN","x-csrf-token"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
)

# Set up database convention for migrations
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}
metadata = MetaData(naming_convention=convention)

# Initialize extensions
db = SQLAlchemy(app, metadata=metadata)
migrate = Migrate(app, db)
api = Api(app)
jwt = JWTManager(app)

# Set Resend API key (For 2fa emails)
resend.api_key = RESEND_API_KEY

# ------------------------
# Utility Functions
# ------------------------

def current_time():
    """
    Get the current time in Mountain Time Zone (America/Denver).

    Returns:
        datetime: Current time in Mountain Time Zone.
    """
    utc_now = datetime.utcnow()
    mountain_timezone = pytz.timezone('America/Denver')
    mountain_time = utc_now.replace(tzinfo=pytz.utc).astimezone(mountain_timezone)
    return mountain_time


def format_bytes(bytes_value):
    """
    Format bytes into human readable format.
    
    Args:
        bytes_value (int): Bytes to format
        
    Returns:
        str: Formatted string (e.g., "1.2 GB")
    """
    if bytes_value is None:
        return "Unknown"
    
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes_value < 1024.0:
            return f"{bytes_value:.1f} {unit}"
        bytes_value /= 1024.0
    return f"{bytes_value:.1f} PB"

def generate_unique_uuid(cls, length=8):
    """
    Generate a unique UUID of specified length.

    Args:
        cls: Class to check for existing UUIDs.
        length (int, optional): Length of the UUID. Defaults to 8.

    Returns:
        str: Unique UUID.
    """
    while True:
        new_uuid = str(uuid.uuid4())[:8]
        existing_instance = cls.query.filter_by(id=new_uuid).first()
        if not existing_instance:
            return new_uuid

def check_user_exists(func):
    """
    Decorator to check if a user exists in the database.

    Args:
        func (function): Function to be decorated.

    Returns:
        function: Decorated function.
    """
    from models.User import User
    @wraps(func)
    def wrapper(*args, **kwargs):
        if user := db.session.query(User).filter_by(id=get_jwt_identity()).first():
            return func(*args, user, **kwargs)
        else:
            return {'error': 'User not found'}, 404
    return wrapper

def check_not_none(*args):
    """
    Checks that all provided arguments are not None.

    Args:
        *args: Variable length argument list.
    
    Returns:
        bool: True if none of the arguments are None, False otherwise.
    """
    return all(arg is not None for arg in args)

def patch_if_exists(keys, data, model):
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

# ------------------------
# Database Initialization
# ------------------------

    
START_TIME = current_time()


# ------------------------
# Main Routes
# ------------------------

@app.route('/')
def home():
    """
    Render the home page with system status dashboard.
    Requires authentication.

    Returns:
        str: Rendered HTML of the dashboard.
    """

    return render_template(
        "landing.html",
    )

# ------------------------
# Application Entry Point
# ------------------------

if __name__ == "__main__":
    app.run(debug=not PROD)