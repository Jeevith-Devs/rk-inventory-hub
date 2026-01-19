import { cn } from "@/lib/utils";

interface LoaderProps {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dots" | "bars" | "spinner";
  fullScreen?: boolean;
  className?: string;
  message?: string;
}

export function Loader({
  size = "md",
  variant = "default",
  fullScreen = false,
  className,
  message,
}: LoaderProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const loaderContent = {
    default: (
      <div
        className={cn(
          "animate-spin rounded-full border-4 border-gray-300 border-t-primary",
          sizeClasses[size]
        )}
      />
    ),
    dots: (
      <div className="flex gap-2 justify-center items-center">
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0s" }}
        />
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
        <div
          className="w-2 h-2 bg-primary rounded-full animate-bounce"
          style={{ animationDelay: "0.4s" }}
        />
      </div>
    ),
    bars: (
      <div className="flex gap-1 justify-center items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1 bg-primary rounded-full animate-pulse"
            style={{
              height: `${(i + 1) * 8}px`,
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    ),
    spinner: (
      <div className="relative inline-flex">
        <div
          className={cn(
            "animate-spin rounded-full border-4 border-gray-200 border-t-primary border-r-primary",
            sizeClasses[size]
          )}
        />
      </div>
    ),
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className={cn("flex flex-col items-center gap-4", className)}>
          {loaderContent[variant]}
          {message && <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>}
          {!message && <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      {loaderContent[variant]}
    </div>
  );
}
