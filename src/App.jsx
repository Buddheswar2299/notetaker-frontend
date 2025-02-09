import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import axios from "axios";

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); 

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("https://notetaker-backend-authenication.onrender.com/protected", { withCredentials: true });
        if (response.status === 200) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <p>Loading...</p>; // Show loading text while checking authentication
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* ✅ Ensure dashboard is only accessible if token exists */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard setIsAuthenticated={setIsAuthenticated} /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
};

export default App;
