# React-Flask Template

A modern, full-stack web application template combining React frontend with Flask backend and SQLAlchemy ORM. Perfect for rapid prototyping and building scalable web applications.

## 🚀 Features

- **Frontend**: React with modern JavaScript (ES6+)
- **Backend**: Flask with Python
- **Database**: SQLAlchemy ORM with support for multiple databases
- **API**: RESTful API structure
- **Development**: Hot reload for both frontend and backend
- **Production Ready**: Configured for deployment

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/react-flask-template.git
cd react-flask-template
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install
# or
yarn install
```

### 4. Database Setup
```bash
# From the backend directory
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

## 🏃‍♂️ Running the Application

### Development Mode

#### Start the Backend Server
```bash
cd backend
python app.py
# Backend will run on http://localhost:5000
```

#### Start the Frontend Server
```bash
cd frontend
npm start
# or
yarn start
# Frontend will run on http://localhost:3000
```

### Production Mode
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../backend
python app.py
```


## 🔧 Configuration

### Backend Configuration
Edit `server/.env` with your settings:
```env
FLASK_ENV=development
DATABASE_URL=sqlite:///app.db
SECRET_KEY=your-secret-key-here
RESEND_API_KEY=XXXXXXX
TEST_DB_URL=xxxxx
```

### Frontend Configuration

## 🗄️ Database Models

The template includes a basic User model. Extend or modify models in `server/models/`:

```python
from app import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
```

## 🛣️ API Routes

Default API routes are available at:
- `GET /users` - Get all users
- `POST /users` - Create a new user
- `GET /users/<id>` - Get user by ID
- `PATCH /users/<id>` - Update user
- `DELETE /users/<id>` - Delete user



## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 🙏 Acknowledgments

- React team for the amazing frontend framework
- Flask team for the lightweight and powerful backend framework
- SQLAlchemy team for the excellent ORM

---
