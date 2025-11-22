import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input, Label, Button } from "../components/ui";
import { ArrowRight, AlertCircle, UserCheck } from "lucide-react";
import logo from "../assets/cowsville-logo.svg";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const { login, loginGuest } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data);
      navigate("/");
    } catch (err: any) {
      console.error("Login submit error:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    try {
      await loginGuest();
      navigate("/");
    } catch (err) {
      setError("Failed to enter demo mode.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen lg:grid lg:grid-cols-2 overflow-hidden bg-white dark:bg-slate-950">
      {/* Left Side - Visuals */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex relative flex-col justify-between p-12 bg-primary-600 text-white overflow-hidden"
      >
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?q=80&w=2948&auto=format&fit=crop"
            alt="Farm Background"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-900/90 via-primary-800/80 to-primary-500/40" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-2xl font-bold tracking-tight">
            <img
              src={logo}
              alt="Cowsville Logo"
              className="w-12 h-12 rounded-full object-cover border-2 border-white/30 shadow-lg"
            />
            Cowsville
          </div>
        </div>

        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">
            Smart Farming, <br />
            <span className="text-primary-200">Simplified.</span>
          </h1>
          <p className="text-lg text-primary-100/90 leading-relaxed">
            Manage your livestock, track health assessments, and optimize your
            farm's productivity with our premium dashboard.
          </p>

          <div className="flex items-center gap-8 pt-4">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-primary-700 bg-slate-200 overflow-hidden"
                >
                  <img
                    src={`https://i.pravatar.cc/100?img=${i + 10}`}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm font-medium">
              <span className="block text-white text-lg font-bold">2k+</span>
              <span className="text-primary-200">Farmers trust us</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-primary-300/60">
          © 2025 Cowsville Agricultural Systems. All rights reserved.
        </div>
      </motion.div>

      {/* Right Side - Login Form */}
      <div className="flex items-center justify-center p-8 lg:p-12 bg-slate-50 dark:bg-slate-950 bg-grid-pattern">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-md space-y-8 bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800"
        >
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-6 lg:hidden">
              <img
                src={logo}
                alt="Cowsville Logo"
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-100 shadow-md"
              />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome Back
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enter your credentials to access the system
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="Enter your username"
                  type="text"
                  disabled={isLoading}
                  {...register("username")}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
                {errors.username && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />{" "}
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a
                    href="#"
                    className="text-xs font-medium text-primary-600 hover:text-primary-500"
                  >
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  disabled={isLoading}
                  {...register("password")}
                  className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all"
                />
                {errors.password && (
                  <p className="text-xs text-red-500 flex items-center mt-1">
                    <AlertCircle className="w-3 h-3 mr-1" />{" "}
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-lg bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 text-sm dark:bg-red-900/10 dark:border-red-900/30 dark:text-red-400"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium">Login Failed</p>
                  <p className="text-xs mt-1 opacity-90">{error}</p>
                </div>
              </motion.div>
            )}

            <div className="space-y-3">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 text-base shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all duration-300"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </Button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-xs text-slate-400">
                  OR
                </span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full h-11"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                View Demo / Guest Access
              </Button>
            </div>
          </form>

          <div className="pt-4 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <a
              href="#"
              className="font-semibold text-primary-600 hover:text-primary-500 transition-colors"
            >
              Contact Admin
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
