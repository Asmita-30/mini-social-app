import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-indigo-500 to-indigo-700 shadow-md">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* 🔹 Left — Logo */}
          <h1 className="text-white text-xl font-bold tracking-wide cursor-pointer">
            DevConnect
          </h1>

          {/* 🔹 Right — User Info */}
          {user && (
            <div className="flex items-center gap-3">
              
              {/* Avatar */}
              <img
                src={user.profilePic || "https://i.pravatar.cc/40"}
                alt="profile"
                className="w-9 h-9 rounded-full border-2 border-white object-cover"
              />

              {/* Username */}
              <span className="text-white font-medium hidden sm:block">
                {user.name}
              </span>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 text-white text-sm px-4 py-1.5 rounded-full transition duration-300 shadow-sm"
              >
                Logout
              </button>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
