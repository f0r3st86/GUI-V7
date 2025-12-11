// Main App component - assembles all components with providers
import React from 'react';
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

// Tab content renderer component
const TabContent: React.FC = () => {
  const { activeTab } = useLoan();

  switch (activeTab) {
    case 'Loan':
      return <LoanTab />;
    case 'Borrower':
      return <BorrowerTab />;
    case 'Collateral':
      return <CollateralTab />;
    case 'Comment':
      return <CommentTab />;
    case 'PayHist':
      return <PayHistTab />;
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
    <ThemeProvider>
      <LoanProvider>
        <ProjectionProvider>
          <ExitProvider>
            <AppLayout />
          </ExitProvider>
        </ProjectionProvider>
      </LoanProvider>
    </ThemeProvider>
  );
};

export default App;
