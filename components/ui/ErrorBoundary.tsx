'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/Card';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('VidyaSetu UI boundary captured an error', error, errorInfo);
  }

  private readonly handleReset = (): void => {
    this.setState({
      hasError: false,
      message: '',
    });
  };

  public render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <Card className="border-rose-200 bg-rose-50/70">
        <CardContent className="space-y-4 py-10 text-center">
          <div className="text-4xl">!</div>
          <div className="space-y-2">
            <CardTitle>Something needs attention</CardTitle>
            <CardDescription>
              {this.state.message || 'An unexpected interface error occurred.'}
            </CardDescription>
          </div>
          <Button onClick={this.handleReset} variant="secondary">
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }
}

