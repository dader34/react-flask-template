
        
from setup import Resource, db, request, jwt_required, get_jwt_identity, get_jwt, check_user_exists, check_not_none, uuid
from models.User import User
from sqlalchemy import or_, func


class Users(Resource):
    """
    Resource for managing user accounts.
    Provides endpoints to list and create users in the system.
    """
    
    @jwt_required()
    @check_user_exists
    def get(self, user):
        """
        Get all users in the system with pagination, sorting, and filtering.
        Restricted to users with can_view_users permission.
        
        Args:
            user: User object (injected by check_user_exists decorator)
            
        Query Parameters:
            page: Page number (default=1)
            per_page: Number of items per page (default=10)
            search_term: Optional search term to filter users
            user_ids: Optional comma-separated list of user IDs to filter by
            sort_by: Field to sort by (default=username)
            sort_dir: Sort direction (asc or desc, default=asc)
            
        Returns:
            200: Paginated list of users with metadata
        """
        
        try:
            # Get pagination parameters
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 10, type=int)

            # Get search term
            search_term = request.args.get('search_term', '')
            

            
            # Get user IDs filter
            user_ids_param = request.args.get('user_ids', '')
            user_ids_filter = []
            if user_ids_param:
                user_ids_filter = [user_id.strip() for user_id in user_ids_param.split(',')]
            
            # Get sort parameters
            sort_by = request.args.get('sort_by', 'username')
            sort_dir = request.args.get('sort_dir', 'asc')
            
            # User fields to return 
            user_fields = (
                'id', 'username', 'first_name', 'last_name', 'start_date', 
                'status',
                'email', 'locked', 'login_attempts'
            )
            
            # Base query
            query = User.query
            
            
            # Apply user IDs filter if provided
            if user_ids_filter:
                query = query.filter(User.id.in_(user_ids_filter))
            
            # Apply search filter if provided
            if search_term:
                search_term_lower = search_term.lower()
                query = query.filter(
                    or_(
                        func.lower(User.username).contains(search_term_lower),
                        func.lower(User.email).contains(search_term_lower),
                        func.lower(User.id).contains(search_term_lower),
                        func.lower(User.first_name).contains(search_term_lower),
                        func.lower(User.last_name).contains(search_term_lower),
                    )
                )
            
            # Count total items before pagination
            total_items = query.count()
            
            # Apply sorting
            if sort_by in ['id', 'username', 'email', 'status', 'first_name', 'last_name'] and hasattr(User, sort_by):
                sort_attr = getattr(User, sort_by)
            else:
                # Default to username sorting
                sort_attr = User.username
            
            if sort_dir == 'asc':
                query = query.order_by(sort_attr.asc())
            else:
                query = query.order_by(sort_attr.desc())
            
            # Apply pagination
            paginated_users = query.paginate(page=page, per_page=per_page)
            
            # Serialize users
            results = []
            for user_obj in paginated_users.items:
                user_dict = user_obj.to_dict(only=user_fields)
                results.append(user_dict)
            
            # Prepare pagination metadata
            pagination = {
                'total_items': total_items,
                'total_pages': paginated_users.pages,
                'current_page': page,
                'per_page': per_page,
                'has_prev': paginated_users.has_prev,
                'has_next': paginated_users.has_next
            }
            
            return {
                'items': results,
                'pagination': pagination
            }, 200
            
        except Exception as e:
            return {'error': str(e)}, 500
        
    @jwt_required()
    @check_user_exists
    def post(self, user):
        """
        Create a new user. Restricted to users with can_edit_users permission.
        
        Args:
            user: User object (injected by check_user_exists decorator)
            
        JSON Body:
            id: User ID
            username: Username
            password: Password (optional, will be auto-generated if not provided)
            start_date: (Optional) Start date
            email: (Optional) Email address
            first_name: (Optional) First name
            last_name: (Optional) Last name
            status: (Optional) Status
            
        Returns:
            201: Success with user ID
            400: Invalid request
        """
        
        
        # Extract request data
        json_data = request.json
        id = json_data.get('id')
        username = json_data.get('username')
        password = json_data.get('password', str(uuid.uuid4())[:8])  # Auto-generate if not provided
        
        # Optional fields
        start_date = json_data.get('start_date')
        email = json_data.get('email')
        first_name = json_data.get('first_name')
        last_name = json_data.get('last_name')
        status = json_data.get('status')

        # Validation
        if not check_not_none(id, username, password):
            return {'error': 'Missing required fields'}, 400
            
        if db.session.get(User, id):
            return {'error': 'A user with that ID already exists'}, 400
        
        
        if not id.isdigit():
            return {'error': 'User ID must only contain numbers'}, 400


        # Create user
        try:
            return self._create_user(
                user, id, username, password,
                start_date, email, status, last_name, first_name
            )
        except Exception as e:
            db.session.rollback()
            return {'error': str(e)}, 400
            
    def _create_user(self, current_user, id, username, password, 
                    start_date=None, email=None, status=None, 
                    last_name=None, first_name=None):
        """
        Helper method to create a new user with the given parameters.
        
        Args:
            current_user: Current authenticated user creating the new user
            id: User ID
            username: Username
            password: Password
            start_date: (Optional) Start date
            email: (Optional) Email address
            status: (Optional) Status
            last_name: (Optional) Last name
            first_name: (Optional) First name
            
        Returns:
            Tuple of (response_data, status_code)
        """
        # Create base user
        user = User(id=id, username=username)
        user.password = password
        
        # Set optional fields if provided
        if start_date is not None:
            user.start_date = start_date
            
        if email is not None:
            user.email = email
            
        if status is not None:
            user.status = status
            
        if last_name is not None:
            user.last_name = last_name
            
        if first_name is not None:
            user.first_name = first_name


        # Add the user to the session
        db.session.add(user)
        
        # Commit all changes
        db.session.commit()
        
        return {'success': user.id}, 201