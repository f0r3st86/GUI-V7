// Main App component - assembles all components with providers
import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ThemeProvider,
  LoanProvider,
  ProjectionProvider,
  ExitProvider,
  useTheme,
  useLoan
} from './context';
import { Header, MenuBar, LoanTable, TabNavigation } from './components/layout';
import {
  LoanTab,
  BorrowerTab,
  CollateralTab,
  CommentTab,
  PayHistTab,
  ProjectionsTab
} from './components/tabs';
import { ErrorBoundary } from './components/ErrorBoundary';
import { enableHighRefreshRate, FPSMonitor, getFrameBudget } from './utils';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Refetch on window focus for data consistency
      refetchOnWindowFocus: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false
    },
    mutations: {
      // Retry failed mutations once
      retry: 1
    }
  }
});

// Tab content renderer component
const TabContent: React.FC = () => {
  const { activeTab } = useLoan();

  switch (activeTab) {
    case 'Loan':
      return (
        <ErrorBoundary>
          <LoanTab />
        </ErrorBoundary>
      );
    case 'Borrower':
      return (
        <ErrorBoundary>
          <BorrowerTab />
        </ErrorBoundary>
      );
    case 'Collateral':
      return (
        <ErrorBoundary>
          <CollateralTab />
        </ErrorBoundary>
      );
    case 'Comment':
      return (
        <ErrorBoundary>
          <CommentTab />
        </ErrorBoundary>
      );
    case 'PayHist':
      return (
        <ErrorBoundary>
          <PayHistTab />
        </ErrorBoundary>
      );
    case 'Projections':
      return (
        <ErrorBoundary>
          <ProjectionsTab />
        </ErrorBoundary>
      );
    default:
      // Placeholder for unimplemented tabs
      return (
        <div className="p-4">
          <div className="text-gray-400 text-center">
            {activeTab} tab content - Coming soon
          </div>
        </div>
      );
  }
};

// Main layout component with theme applied
const AppLayout: React.FC = () => {
  const { styles } = useTheme();

  // Enable 120fps optimizations on mount
  useEffect(() => {
    const budget = getFrameBudget();
    console.log(`[Performance] Display supports ${budget.fps}fps (${budget.budget}ms budget)`);

    // Enable CSS optimizations for high refresh rates
    enableHighRefreshRate();

    // Optional: Monitor actual FPS (only in dev, remove or comment out for production)
    const enableFPSMonitor = true; // Set to false in production
    if (enableFPSMonitor) {
      const fpsMonitor = new FPSMonitor((fps) => {
        const status = fps >= 115 ? '🟢' : fps >= 55 ? '🟡' : '🔴';
        console.log(`${status} FPS: ${fps} (Target: ${budget.fps})`);
      });
      fpsMonitor.start();

      // Cleanup
      return () => fpsMonitor.stop();
    }
  }, []);

  return (
    <div className={`min-h-screen ${styles.mainBg}`}>
      {/* Header */}
      <Header />

      {/* Menu Bar */}
      <MenuBar />

      {/* Loan Table (Relationship Loans) */}
      <LoanTable />

      {/* Tab Navigation */}
      <TabNavigation />

      {/* Tab Content */}
      <div className={`${styles.sectionBg}`}>
        <TabContent />
      </div>
    </div>
  );
};

// Main App with all providers
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LoanProvider>
          <ProjectionProvider>
            <ExitProvider>
              <AppLayout />
            </ExitProvider>
          </ProjectionProvider>
        </LoanProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
