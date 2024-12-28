import React, { createContext, useState, useEffect } from "react";

// Create the context
const UserContext = createContext();

// Create a provider component
export const UserProvider = ({ children }) => {
  // States
  const [user, setUser] = useState(null); // User state
  const [paper, setPaper] = useState(""); // Current paper state
  const [paperList, setPaperList] = useState([]); // List of papers
  const [notes, setNotes] = useState([]); // Notes state

  // Load user from localStorage on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user from localStorage", error);
      }
    }
  }, []);

  // Update localStorage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Login function
  const login = (userData) => {
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    setUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        paper,
        setPaper,
        paperList,
        setPaperList,
        notes,
        setNotes,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
