import App from "./App";
import ErrorPage from "./pages/ErrorPage";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";



const routes = [
    {
        path: '/',
        element: <App />,
        errorElement: <ErrorPage />,
        children: [
            {
                path: '/error',
                element: <ErrorPage />
            },
        ]
    },
    {
        path: '/login',
        element: <LoginPage />
    }
];

export default routes;