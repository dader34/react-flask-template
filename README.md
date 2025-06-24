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

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

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

## 📁 Project Structure

```
react-flask-template/
├── backend/
│   ├── app.py                 # Flask application entry point
│   ├── config.py              # Configuration settings
│   ├── models/                # SQLAlchemy models
│   │   ├── __init__.py
│   │   └── user.py
│   ├── routes/                # API routes
│   │   ├── __init__.py
│   │   └── api.py
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example          # Environment variables template
│   └── migrations/           # Database migrations
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── services/         # API service functions
│   │   ├── App.js           # Main React component
│   │   └── index.js         # React entry point
│   ├── package.json         # Node.js dependencies
│   └── build/              # Production build (generated)
└── README.md
```

## 🔧 Configuration

### Backend Configuration
Edit `backend/.env` with your settings:
```env
FLASK_ENV=development
DATABASE_URL=sqlite:///app.db
SECRET_KEY=your-secret-key-here
```

### Frontend Configuration
API endpoints are configured in `frontend/src/services/api.js`

## 🗄️ Database Models

The template includes a basic User model. Extend or modify models in `backend/models/`:

```python
from app import db

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
```

## 🛣️ API Routes

Default API routes are available at:
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user
- `GET /api/users/<id>` - Get user by ID
- `PUT /api/users/<id>` - Update user
- `DELETE /api/users/<id>` - Delete user

## 🚀 Deployment

### Heroku Deployment
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy using Git:
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:
- Open an issue on GitHub
- Check the documentation
- Review existing issues for solutions

## 🙏 Acknowledgments

- React team for the amazing frontend framework
- Flask team for the lightweight and powerful backend framework
- SQLAlchemy team for the excellent ORM

---

**Happy coding!** 🎉