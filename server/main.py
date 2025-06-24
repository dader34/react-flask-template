#!/usr/bin/python3
from setup import app, api

from routes.GetUsers import Users
from routes.Login import Login
from routes.MyUser import MyUser
from routes.Refresh import RefreshToken
from routes.Logout import Logout
from routes.GetUserById import UserById
from routes.ResetPassword import ResetPassword

# Flask restful api implementation

api.add_resource(Users, '/users')
api.add_resource(Login, '/login')
api.add_resource(MyUser, '/user')
api.add_resource(RefreshToken, '/refresh')
api.add_resource(Logout, '/logout')
api.add_resource(UserById,'/users/<string:id>')
api.add_resource(ResetPassword, '/reset_password', '/reset_password/<string:reset_code>')

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5252,debug=True)
