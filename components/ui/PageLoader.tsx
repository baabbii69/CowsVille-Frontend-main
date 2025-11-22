import React from "react";
import { motion } from "framer-motion";
import logo from "../../assets/cowsville-logo.svg";
import { cn } from "./index";

interface PageLoaderProps {
  variant?: "fullscreen" | "inline";
  className?: string;
}

export const PageLoader = ({
  variant = "fullscreen",
  className,
}: PageLoaderProps) => {
  const isFullscreen = variant === "fullscreen";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        isFullscreen
          ? "fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 backdrop-blur-sm"
          : "w-full min-h-[60vh] bg-transparent",
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer Ring Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.1, 1],
            rotate: 360,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute h-32 w-32 rounded-full border-2 border-dashed border-primary-500/30 dark:border-primary-400/30"
        />

        {/* Inner Ring Animation */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute h-24 w-24 rounded-full border border-primary-500/20 dark:border-primary-400/20"
        />

        {/* Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl shadow-primary-500/10 dark:bg-slate-900"
        >
          <motion.img
            src={logo}
            alt="Loading..."
            className="h-12 w-12 object-contain"
            animate={{
              scale: [1, 1.1, 1],
              filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 flex flex-col items-center gap-2"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Cowsville
        </h3>
        <div className="flex items-center gap-1">
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Loading Data
          </span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.1 }}
            className="text-primary-500"
          >
            .
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.2 }}
            className="text-primary-500"
          >
            .
          </motion.span>
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.3 }}
            className="text-primary-500"
          >
            .
          </motion.span>
        </div>
      </motion.div>
    </div>
  );
};
