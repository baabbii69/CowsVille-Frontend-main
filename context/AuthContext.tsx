import React, { createContext, useContext, useState, useEffect } from "react";
import { LoginCredentials, User } from "../types";
import api, { setDemoMode } from "../services/api";

interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  loginGuest: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const isDemo = localStorage.getItem("demo_mode") === "true";

      if (isDemo) {
        setUser({ username: "Guest", role: "Farmer" });
        setIsLoading(false);
        return;
      }

      const storedAuth = localStorage.getItem("auth_credentials");
      if (storedAuth) {
        let username = "User";
        try {
          const parsed = JSON.parse(storedAuth);
          username = parsed.username;
        } catch (e) {
          console.error("Invalid stored credentials", e);
          localStorage.removeItem("auth_credentials");
          setUser(null);
          setIsLoading(false);
          return;
        }

        try {
          // Attempt to fetch a protected resource to validate the stored credentials
          await api.get("/farms/");
          setUser({ username, role: "Admin" });
        } catch (error: any) {
          console.error("Session validation failed:", error);
          // Only log out if explicitly unauthorized.
          // Keep session for network errors (503, CORS, etc) to prevent login loops.
          if (
            error.response &&
            (error.response.status === 401 || error.response.status === 403)
          ) {
            localStorage.removeItem("auth_credentials");
            setUser(null);
          } else {
            // For other errors, assume valid session but maybe offline/server issue
            // We still set the user so the app loads
            setUser({ username, role: "Admin" });
          }
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    // Disable demo mode if trying real login
    setDemoMode(false);

    const token = btoa(`${credentials.username}:${credentials.password}`);

    try {
      const response = await api.get("/farms/", {
        headers: { Authorization: `Basic ${token}` },
      });

      console.log("Login successful. Status:", response.status);

      localStorage.setItem("auth_credentials", JSON.stringify(credentials));
      setUser({ username: credentials.username, role: "Admin" });
    } catch (error: any) {
      console.error("Login failed details:", error);

      if (error.code === "ERR_NETWORK") {
        throw new Error(
          "Network Error: Unable to connect to server. Please check your connection or use Guest Access."
        );
      }

      if (error.response) {
        if (error.response.status === 401) {
          throw new Error("Invalid username or password.");
        } else if (error.response.status === 403) {
          throw new Error("Access denied.");
        }
      }

      throw new Error(error.message || "An unexpected error occurred.");
    }
  };

  const loginGuest = async () => {
    setIsLoading(true);
    // Simulate a small delay for effect
    await new Promise((resolve) => setTimeout(resolve, 800));
    setDemoMode(true);
    setUser({ username: "Guest", role: "Farmer" });
    setIsLoading(false);
  };

  const logout = () => {
    localStorage.removeItem("auth_credentials");
    setDemoMode(false);
    setUser(null);
    window.location.hash = "#/login";
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginGuest,
        logout,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
