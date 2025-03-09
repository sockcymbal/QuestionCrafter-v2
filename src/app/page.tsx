"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Loading component with nice animation
const LoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
    <div className="text-center space-y-4">
      <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
      <p className="text-amber-300 text-lg font-medium">
        Loading QuestionCrafter...
      </p>
    </div>
  </div>
);

// Error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("QuestionCrafter error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <h2 className="text-2xl font-bold text-amber-300">
              Something went wrong
            </h2>
            <p className="text-gray-300">
              Please refresh the page to try again
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dynamically import QuestionCrafter with SSR disabled
const QuestionCrafterApp = dynamic(
  () => import("../components/QuestionCrafter"),
  {
    ssr: false,
    loading: LoadingFallback,
  }
);

export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
          <QuestionCrafterApp />
        </main>
      </Suspense>
    </ErrorBoundary>
  );
}