import React, { createContext, useState, useEffect } from "react";
import axios from "../api/axios"; // your axios base config

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Load user from localStorage on refresh
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // 🔐 LOGIN
  const login = async (formData) => {
    try {
      const res = await axios.post("/auth/login", formData);

      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      alert("Login successful 🚀");
    } catch (err) {
      alert(err.response?.data?.message || "Login failed");
    }
  };

  // 📝 SIGNUP
  const signup = async (formData) => {
    try {
      const res = await axios.post("/auth/signup", formData);

      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", res.data.token);

      alert("Account created 🎉");
    } catch (err) {
      alert(err.response?.data?.message || "Signup failed");
    }
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
