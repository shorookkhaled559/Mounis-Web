interface LoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullPage?: boolean;
}

export function Loader({ text, size = "md", fullPage = false }: LoaderProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-24 w-24",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`${sizeClasses[size]} relative`}>
        <svg
          className="h-full w-full"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
        >
          <circle cx="12" cy="12" r="0" fill="var(--primary)">
            <animate
              id="spinner_0"
              attributeName="r"
              calcMode="spline"
              dur="1.2s"
              values="0;11"
              keySplines=".52,.6,.25,.99"
              fill="freeze"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              calcMode="spline"
              dur="1.2s"
              values="1;0"
              keySplines=".52,.6,.25,.99"
              fill="freeze"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="12" cy="12" r="0" fill="var(--primary)">
            <animate
              attributeName="r"
              begin="0.4s"
              calcMode="spline"
              dur="1.2s"
              values="0;11"
              keySplines=".52,.6,.25,.99"
              fill="freeze"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              begin="0.4s"
              calcMode="spline"
              dur="1.2s"
              values="1;0"
              keySplines=".52,.6,.25,.99"
              fill="freeze"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx="12" cy="12" r="0" fill="var(--primary)">
            <animate
              attributeName="r"
              begin="0.8s"
              calcMode="spline"
              dur="1.2s"
              values="0;11"
              keySplines=".52,.6,.25,.99"
              fill="freeze"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              begin="0.8s"
              calcMode="spline"
              dur="1.2s"
              values="1;0"
              keySplines=".52,.6,.25,.99"
              fill="freeze"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
      {text && <p className="text-sm text-ink-muted">{text}</p>}
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[400px] items-center justify-center py-12">
      {content}
    </div>
  );
}

// Removed skeleton components - using simple loader instead
