import { BrowserRouter, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Destinations from "./pages/Destinations";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/destinations"
          element={
            <ProtectedRoute>
              <Destinations />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  );
}
