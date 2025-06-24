import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import routes from './routes';
import { AuthProvider } from './context/AuthContext';
import { SnackbarProvider } from 'notistack'
import { NotifyProvider } from './context/NotificationContext';
import { UtilsProvider } from './context/UtilContext';
// import 'bootstrap/dist/css/bootstrap.min.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
const router = createBrowserRouter(routes);



root.render(
  <UtilsProvider>
    <SnackbarProvider autoHideDuration={3000} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
      <NotifyProvider>
        <AuthProvider>
          <RouterProvider router={router}>
            {/* <App /> */}
          </RouterProvider>
        </AuthProvider>
      </NotifyProvider>
    </SnackbarProvider>
  </UtilsProvider>
);