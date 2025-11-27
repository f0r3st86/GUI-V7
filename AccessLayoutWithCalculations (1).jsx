import React, { useState } from 'react';
import { 
  ChevronDown, Filter, Search, Bell, Settings, User, 
  TrendingUp, AlertCircle, Star, MoreHorizontal,
  ArrowUpRight, ArrowDownRight, Activity, Sun, Moon
} from 'lucide-react';

// US States constant for dropdowns
const US_STATES = [
  { code: '', name: 'Select State' },
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'PR', name: 'Puerto Rico' },
  { code: 'RI', name: 'Rhode Island' }, { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' }, { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' }, { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' }, { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'Washington DC' }
];

// Main component definition - This is a React functional component
// In React, components are like custom HTML elements that can have their own logic and styling
const AccessLayoutRobinhoodStyle = () => {
  // React hooks - These are special functions that let us add features to our component
  // useState creates a variable that React watches for changes
  // When the variable changes, React automatically updates the display
  
  // Currently selected loan ID - when user clicks a loan, this updates
  const [selectedLoan, setSelectedLoan] = useState('7758');
  
  // Which tab is active in the loan details section
  const [activeTab, setActiveTab] = useState('Loan');
  
  // Column to sort by (not fully implemented in this demo)
  const [sortColumn, setSortColumn] = useState('');
  
  // Theme state - 'dark' or 'light'
  const [theme, setTheme] = useState('dark');
  
  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  // Payment history data for editable table (PayHist tab)
  const [paymentRecords, setPaymentRecords] = useState([
    // Loan 2461 payments
    { id: 1, loanNo: '2461', year: '2025', month: '4', amount: '3522.00' },
    { id: 2, loanNo: '2461', year: '2025', month: '3', amount: '3522.00' },
    { id: 3, loanNo: '2461', year: '2025', month: '2', amount: '3522.00' },
    { id: 4, loanNo: '2461', year: '2025', month: '1', amount: '3522.00' },
    { id: 5, loanNo: '2461', year: '2024', month: '12', amount: '3522.00' },
    { id: 6, loanNo: '2461', year: '2024', month: '11', amount: '3522.00' },
    
    // Loan 7758 payments
    { id: 7, loanNo: '7758', year: '2025', month: '10', amount: '608.15' },
    { id: 8, loanNo: '7758', year: '2025', month: '9', amount: '608.15' },
    { id: 9, loanNo: '7758', year: '2025', month: '8', amount: '608.15' },
    { id: 10, loanNo: '7758', year: '2025', month: '7', amount: '1500.00' },
    { id: 11, loanNo: '7758', year: '2025', month: '6', amount: '633.15' },
    { id: 12, loanNo: '7758', year: '2024', month: '12', amount: '608.15' },
    { id: 13, loanNo: '7758', year: '2024', month: '11', amount: '608.15' },
    { id: 14, loanNo: '7758', year: '2024', month: '10', amount: '608.15' },
  ]);
  
  // Get next ID for new payment record
  const getNextPaymentId = () => {
    return Math.max(...paymentRecords.map(r => r.id), 0) + 1;
  };
  
  // Get filtered payment records for selected loan
  const getFilteredPaymentRecords = () => {
    const filtered = paymentRecords.filter(record => record.loanNo === selectedLoan);
    // Always add an empty row at the end for new entries
    if (filtered.length === 0 || (filtered[filtered.length - 1] && filtered[filtered.length - 1].year)) {
      return [...filtered, { id: getNextPaymentId(), loanNo: selectedLoan, year: '', month: '', amount: '' }];
    }
    return filtered;
  };
  
  // Payment grid data (derived from payment records)
  const [paymentGridData, setPaymentGridData] = useState({});
  
  // Helper function to mask SSN/EIN - shows only last 4 digits
  const maskSsnEin = (value) => {
    if (!value) return '';
    // Remove any dashes or spaces for processing
    const cleaned = value.replace(/[-\s]/g, '');
    if (cleaned.length < 4) return value;
    // Show only last 4 digits
    const lastFour = cleaned.slice(-4);
    // Determine if it's EIN (XX-XXXXXXX) or SSN (XXX-XX-XXXX)
    if (value.includes('-') && value.indexOf('-') === 2) {
      // EIN format: XX-XXXXXXX -> **-***XXXX
      return `**-***${lastFour}`;
    } else {
      // SSN format: XXX-XX-XXXX -> ***-**-XXXX
      return `***-**-${lastFour}`;
    }
  };

  // List of all borrowers and guarantors
  // *** SQL CONNECTION POINT ***
  // SELECT * FROM borrowers WHERE relationship = 'Haskell' (or current relationship)
  const [borrowersList, setBorrowersList] = useState([
    {
      id: 1,
      relationship: 'Haskell',
      name: 'Blaze Restaurant Group LLC',
      address1: '123 Main Street',
      address2: 'Suite 200',
      city: 'Portland',
      state: 'ME',
      zip: '04101',
      phone: '(207) 555-0123',
      dob: '',
      ssnEin: '45-1234567',
      creditScore: '720',
      creditScoreDate: '10/15/24',
      bkStatus: 'none',
      bkChapter: '',
      bkCourtCase: '',
      bkCourtLocation: '',
      bkAssets: 'No Assets',
      type: 'Borrower',
      // Per-borrower loan relationships
      loanRelationships: {
        '2461': { selected: false, role: 'Borrower' },
        '5091': { selected: true, role: 'Borrower' },
        '7855': { selected: false, role: 'Borrower' },
        '3685': { selected: false, role: 'Borrower' },
        '3205': { selected: false, role: 'Borrower' },
        '6826': { selected: false, role: 'Borrower' },
        '7758': { selected: true, role: 'Borrower' }
      }
    },
    {
      id: 2,
      relationship: 'Haskell',
      name: 'Matthew Haskell',
      address1: '456 Oak Avenue',
      address2: '',
      city: 'Portland',
      state: 'ME',
      zip: '04102',
      phone: '(207) 555-0456',
      dob: '03/15/1975',
      ssnEin: '123-45-6789',
      creditScore: '750',
      creditScoreDate: '09/20/24',
      bkStatus: 'none',
      bkChapter: '',
      bkCourtCase: '',
      bkCourtLocation: '',
      bkAssets: 'No Assets',
      type: 'Guarantor',
      // Per-borrower loan relationships
      loanRelationships: {
        '2461': { selected: true, role: 'Guarantor' },
        '5091': { selected: false, role: 'Guarantor' },
        '7855': { selected: true, role: 'Guarantor' },
        '3685': { selected: true, role: 'Guarantor' },
        '3205': { selected: true, role: 'Borrower' },
        '6826': { selected: true, role: 'Borrower' },
        '7758': { selected: false, role: 'Guarantor' }
      }
    },
    {
      id: 3,
      relationship: 'Haskell',
      name: 'Rocky Coast Real Estate Group LLC',
      address1: '789 Pine Street',
      address2: '',
      city: 'Portland',
      state: 'ME',
      zip: '04103',
      phone: '(207) 555-0789',
      dob: '',
      ssnEin: '98-7654321',
      creditScore: '680',
      creditScoreDate: '08/10/24',
      bkStatus: 'none',
      bkChapter: '',
      bkCourtCase: '',
      bkCourtLocation: '',
      bkAssets: 'No Assets',
      type: 'Borrower',
      // Per-borrower loan relationships
      loanRelationships: {
        '2461': { selected: true, role: 'Borrower' },
        '5091': { selected: false, role: 'Borrower' },
        '7855': { selected: true, role: 'Borrower' },
        '3685': { selected: true, role: 'Borrower' },
        '3205': { selected: false, role: 'Borrower' },
        '6826': { selected: false, role: 'Borrower' },
        '7758': { selected: false, role: 'Borrower' }
      }
    }
  ]);
  
  // Currently selected borrower for editing
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(1);
  
  // Delete confirmation popup state
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    borrowerId: null,
    borrowerName: ''
  });
  
  // Loan relationships are now stored per-borrower in borrowersList.loanRelationships
  // This provides proper per-borrower relationship management
  
  // Collateral data state
  const [collateralList, setCollateralList] = useState([
    {
      id: 1,
      loanNo: '7758',
      collateralCode: 'Commercial Property',
      description: 'Commercial Building - Restaurant',
      address1: '500 Commercial Street',
      city: 'Portland',
      state: 'ME',
      zip: '04101',
      county: 'Cumberland',
      parcelId: 'R12-345-678',
      taxes: '12,500',
      delinquentTaxes: '0',
      taxAssessedValue: '450,000',
      taxMarketValue: '475,000',
      sellerLienPosition: '1',
      sellerLienAmount: '32,800',
      titleLienPosition: '1',
      titleLienAmount: '32,800',
      listPrice: '550,000',
      daysOnMarket: '45',
      appraisedValue: '525,000',
      appraisedDate: '06/15/24',
      ourValue: '500,000',
      ourValueDate: '07/01/24',
      bpoValue: '490,000',
      bpoDate: '07/10/24',
      sqft: '4,500',
      acres: '0.35',
      yearBuilt: '1995',
      units: '1'
    },
    {
      id: 2,
      loanNo: '2461',
      collateralCode: 'Multi-Family',
      description: '12-Unit Apartment Building',
      address1: '1200 Main Street',
      city: 'Portland',
      state: 'ME',
      zip: '04102',
      county: 'Cumberland',
      parcelId: 'R45-678-901',
      taxes: '18,000',
      delinquentTaxes: '4,500',
      taxAssessedValue: '850,000',
      taxMarketValue: '900,000',
      sellerLienPosition: '1',
      sellerLienAmount: '300,000',
      titleLienPosition: '1',
      titleLienAmount: '300,000',
      listPrice: '975,000',
      daysOnMarket: '90',
      appraisedValue: '950,000',
      appraisedDate: '05/20/24',
      ourValue: '925,000',
      ourValueDate: '06/01/24',
      bpoValue: '900,000',
      bpoDate: '06/15/24',
      sqft: '12,000',
      acres: '0.75',
      yearBuilt: '1985',
      units: '12'
    }
  ]);
  
  // Currently selected collateral for editing
  const [selectedCollateralId, setSelectedCollateralId] = useState(1);
  
  // Collateral to Loan relationships - tracks which loans this collateral secures
  const [collateralLoanRelationships, setCollateralLoanRelationships] = useState({
    1: { // Collateral ID 1
      '2461': false,
      '5091': false,
      '7855': false,
      '3685': false,
      '3205': false,
      '6826': false,
      '7758': true
    },
    2: { // Collateral ID 2
      '2461': true,
      '5091': false,
      '7855': false,
      '3685': false,
      '3205': false,
      '6826': false,
      '7758': false
    }
  });
  
  // Delete confirmation for collateral
  const [deleteCollateralConfirmation, setDeleteCollateralConfirmation] = useState({
    show: false,
    collateralId: null,
    collateralDescription: ''
  });
  
  // Comments data state
  // *** SQL CONNECTION POINT ***
  // SELECT * FROM comments WHERE loan_id IN (SELECT mwLoanNo FROM loans WHERE relationship = 'Haskell')
  const [commentsList, setCommentsList] = useState([
    {
      id: 1,
      loanNo: '7758',
      commentType: 'Note',
      date: '11/08/24',
      text: `Borrower contacted regarding payment schedule.\n\nSpoke with Matthew Haskell on 11/08/24 at 2:30pm. Discussed upcoming payment due on 12/01/24. Borrower confirmed ability to make payment on time.\n\nFollow up scheduled for 11/25/24 if payment not received by 11/20/24.`
    },
    {
      id: 2,
      loanNo: '7758',
      commentType: 'Legal',
      date: '10/15/24',
      text: `Title work completed. All liens properly recorded.`
    },
    {
      id: 3,
      loanNo: '2461',
      commentType: 'Underwriting',
      date: '09/20/24',
      text: `Annual review completed. Property value confirmed at $950,000 based on recent appraisal. Borrower financial statements show strong performance with DSCR of 1.45. Recommend continuing current terms.`
    }
  ]);
  
  // Selected comment ID
  const [selectedCommentId, setSelectedCommentId] = useState(1);
  
  // Comment types
  const commentTypes = ['Note', 'Legal', 'Underwriting', 'Property', 'Servicing', 'Collection', 'Other'];
  
  // Get next comment ID
  const getNextCommentId = () => {
    return Math.max(...commentsList.map(c => c.id), 0) + 1;
  };
  
  // Get selected comment data
  const selectedComment = commentsList.find(c => c.id === selectedCommentId);
  
  // Add new comment
  const addNewComment = () => {
    const today = new Date();
    const formattedDate = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear().toString().slice(-2)}`;
    
    const newComment = {
      id: getNextCommentId(),
      loanNo: selectedLoan,
      commentType: 'Note',
      date: formattedDate,
      text: ''
    };
    setCommentsList(prev => [newComment, ...prev]);
    setSelectedCommentId(newComment.id);
    // *** SQL CONNECTION POINT ***
    // INSERT INTO comments (loan_id, comment_type, date, text) VALUES (...)
  };
  
  // Update comment field
  const handleCommentFieldChange = (field, value) => {
    setCommentsList(prev => prev.map(comment =>
      comment.id === selectedCommentId
        ? { ...comment, [field]: value }
        : comment
    ));
    // *** SQL CONNECTION POINT ***
    // UPDATE comments SET {field} = {value} WHERE id = {selectedCommentId}
  };
  
  // Delete comment
  const deleteComment = (id) => {
    if (commentsList.length <= 1) return;
    
    // Get the comment being deleted for confirmation message
    const commentToDelete = commentsList.find(c => c.id === id);
    const confirmMessage = `Are you sure you want to delete this comment?\n\nLoan: ${commentToDelete.loanNo}\nType: ${commentToDelete.commentType}\nDate: ${commentToDelete.date}`;
    
    if (!window.confirm(confirmMessage)) {
      return; // User cancelled
    }
    
    // Calculate which comment to select before deleting
    const currentIndex = commentsList.findIndex(c => c.id === id);
    const remainingComments = commentsList.filter(c => c.id !== id);
    
    // Select the next comment (or previous if deleting last one)
    if (remainingComments.length > 0) {
      const newSelectedComment = remainingComments[currentIndex < remainingComments.length ? currentIndex : currentIndex - 1];
      setSelectedCommentId(newSelectedComment.id);
    }
    
    // Delete the comment
    setCommentsList(prev => prev.filter(c => c.id !== id));
    
    // *** SQL CONNECTION POINT ***
    // DELETE FROM comments WHERE id = {id}
  };
  
  // Get first line of comment text for preview
  const getCommentPreview = (text) => {
    if (!text) return '(No text)';
    const firstLine = text.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 50) + '...' : firstLine;
  };
  
  // ===== PROJECTIONS STATE =====
  // Payment method selection
  const [projectionPaymentMethod, setProjectionPaymentMethod] = useState('Contractual');
  const paymentMethods = ['User Enter', 'Contractual', 'Term Pmt', 'Interest Payment', '% of Trail Pmt'];
  
  // Rate method selection
  const [projectionRateMethod, setProjectionRateMethod] = useState('Contractual');
  const rateMethods = ['Contractual', 'User Enter'];
  
  // User-entered values
  const [projectionUserPayment, setProjectionUserPayment] = useState('');
  const [projectionUserRate, setProjectionUserRate] = useState('');
  
  // Term payment settings
  const [projectionAmortMonths, setProjectionAmortMonths] = useState('360'); // Default 30 years
  
  // % of Trail Pmt settings
  const [projectionTrailPeriod, setProjectionTrailPeriod] = useState('12'); // 12, 6, or 3 months
  const [projectionTrailPercentage, setProjectionTrailPercentage] = useState('100'); // Default 100%
  
  // Expense fields
  const [projectionInitialLegal, setProjectionInitialLegal] = useState('');
  const [projectionInitialLegalStartMonth, setProjectionInitialLegalStartMonth] = useState('1');
  const [projectionHoldingCosts, setProjectionHoldingCosts] = useState('');
  const [projectionHoldingCostsEndMonth, setProjectionHoldingCostsEndMonth] = useState('12');
  const [projectionAddBackPercentage, setProjectionAddBackPercentage] = useState('');
  const [projectionAddBackBasis, setProjectionAddBackBasis] = useState('Initial Only'); // 'Initial Only' or 'Initial + Holding'
  
  // Calculate total holding costs
  const calculateTotalHoldingCosts = () => {
    const monthlyCost = parseFloat(projectionHoldingCosts) || 0;
    const legalStartMonth = parseInt(projectionInitialLegalStartMonth) || 0;
    const holdingEndMonth = parseInt(projectionHoldingCostsEndMonth) || 0;
    
    // Holding costs apply from (legalStartMonth + 1) to holdingEndMonth
    const numberOfMonths = Math.max(0, holdingEndMonth - legalStartMonth);
    return monthlyCost * numberOfMonths;
  };
  
  // Calculate add back to exit
  const calculateAddBackToExit = () => {
    const percentage = parseFloat(projectionAddBackPercentage) / 100 || 0;
    const initialLegal = parseFloat(projectionInitialLegal) || 0;
    const totalHolding = calculateTotalHoldingCosts();
    
    if (projectionAddBackBasis === 'Initial Only') {
      return initialLegal * percentage;
    } else {
      return (initialLegal + totalHolding) * percentage;
    }
  };
  
  // Calculate monthly income for a given month number
  const getProjectedMonthlyIncome = (monthNumber) => {
    return calculateProjectedPayment();
  };
  
  // Calculate monthly expenses for a given month number
  const getProjectedMonthlyExpenses = (monthNumber) => {
    let expenses = 0;
    
    // Add initial legal if this is the start month
    const legalStartMonth = parseInt(projectionInitialLegalStartMonth) || 0;
    if (monthNumber === legalStartMonth) {
      expenses += parseFloat(projectionInitialLegal) || 0;
    }
    
    // Add holding costs starting AFTER initial legal month, up to end month
    const holdingEndMonth = parseInt(projectionHoldingCostsEndMonth) || 0;
    if (monthNumber > legalStartMonth && monthNumber <= holdingEndMonth) {
      expenses += parseFloat(projectionHoldingCosts) || 0;
    }
    
    return expenses;
  };
  
  // Calculate net cash flow for a given month number
  const getProjectedNetCashFlow = (monthNumber) => {
    return getProjectedMonthlyIncome(monthNumber) - getProjectedMonthlyExpenses(monthNumber);
  };
  
  // Build projection data grid for display (like payment history grid)
  const buildProjectionGrid = () => {
    const grid = {
      income: {},
      expenses: {},
      netCashFlow: {}
    };
    
    // Build for 5 years (60 months)
    const currentYear = new Date().getFullYear();
    let monthCounter = 1;
    
    for (let year = 0; year < 5; year++) {
      const yearKey = (currentYear + year).toString();
      grid.income[yearKey] = {};
      grid.expenses[yearKey] = {};
      grid.netCashFlow[yearKey] = {};
      
      for (let month = 1; month <= 12; month++) {
        if (monthCounter <= 60) {
          grid.income[yearKey][month] = getProjectedMonthlyIncome(monthCounter);
          grid.expenses[yearKey][month] = getProjectedMonthlyExpenses(monthCounter);
          grid.netCashFlow[yearKey][month] = getProjectedNetCashFlow(monthCounter);
          monthCounter++;
        }
      }
    }
    
    return grid;
  };
  
  // Calculate year sum for projection grid
  const calculateProjectionYearSum = (yearData) => {
    return Object.values(yearData).reduce((sum, val) => sum + (val || 0), 0);
  };
  
  // Calculate the projected payment based on selected method
  const calculateProjectedPayment = () => {
    if (!selectedLoanData) return 0;
    
    switch (projectionPaymentMethod) {
      case 'User Enter':
        return parseFloat(projectionUserPayment) || 0;
        
      case 'Contractual':
        return selectedLoanData.pmt || 0;
        
      case 'Term Pmt':
        // Excel PMT function: PMT(rate/12, nper, -pv)
        const rate = projectionRateMethod === 'Contractual' 
          ? (selectedLoanData.intRate / 100 / 12)
          : (parseFloat(projectionUserRate) / 100 / 12);
        const nper = parseInt(projectionAmortMonths) || 360;
        const pv = selectedLoanData.principal;
        
        if (rate === 0) return pv / nper;
        const payment = pv * (rate * Math.pow(1 + rate, nper)) / (Math.pow(1 + rate, nper) - 1);
        return payment;
        
      case 'Interest Payment':
        const intRate = projectionRateMethod === 'Contractual'
          ? selectedLoanData.intRate
          : parseFloat(projectionUserRate) || 0;
        return selectedLoanData.principal * (intRate / 100 / 12);
        
      case '% of Trail Pmt':
        const trailingData = calculateTrailingPayments(
          selectedLoan, 
          parseInt(projectionTrailPeriod), 
          selectedLoanData.lastImportDate
        );
        if (!trailingData) return 0;
        const trailMonthly = trailingData.monthly;
        const percentage = parseFloat(projectionTrailPercentage) / 100;
        return trailMonthly * percentage;
        
      default:
        return 0;
    }
  };
  
  // Get the effective rate being used
  const getProjectedRate = () => {
    if (!selectedLoanData) return 0;
    return projectionRateMethod === 'Contractual' 
      ? selectedLoanData.intRate 
      : parseFloat(projectionUserRate) || 0;
  };
  
  // ===== END PROJECTIONS STATE =====
  
  // ===== EXITS STATE =====
  // Exit method selection
  const [exitMethod, setExitMethod] = useState('Pay in Full');
  const exitMethods = ['Pay in Full', 'DPO', 'Value Cap', 'User Enter', 'YTM Sell Solve', 'Liquidation'];
  
  // Exit timing
  const [exitStartMonth, setExitStartMonth] = useState('1');
  const [exitEndMonth, setExitEndMonth] = useState('24'); // Default 24 months, max 60
  
  // Method-specific parameters
  const [exitDpoPercentage, setExitDpoPercentage] = useState('95'); // Default 95% of PIF
  const [exitValueCapPercentage, setExitValueCapPercentage] = useState('90'); // Default 90% of collateral
  const [exitUserEnterAmount, setExitUserEnterAmount] = useState('');
  const [exitYtmDesired, setExitYtmDesired] = useState(''); // Desired YTM %
  const [exitLiquidationMonths, setExitLiquidationMonths] = useState('12');
  const [exitLiquidationAddInterest, setExitLiquidationAddInterest] = useState(false);
  
  // Calculate Pay in Full amount (Excel FV function equivalent)
  const calculatePayInFull = () => {
    if (!selectedLoanData) return 0;
    
    const rate = getProjectedRate() / 100 / 12; // Monthly rate
    const payment = calculateProjectedPayment();
    const nper = parseInt(exitEndMonth) - parseInt(exitStartMonth) + 1; // Number of periods
    const pv = selectedLoanData.principal; // Current UPB
    
    // FV = PV * (1 + rate)^nper - Payment * [((1 + rate)^nper - 1) / rate]
    // Plus one more payment for the final month
    if (rate === 0) {
      return pv + payment * nper + payment;
    }
    
    const fv = pv * Math.pow(1 + rate, nper) - payment * ((Math.pow(1 + rate, nper) - 1) / rate) + payment;
    return fv;
  };
  
  // Calculate DPO amount
  const calculateDpo = () => {
    const pif = calculatePayInFull();
    const percentage = parseFloat(exitDpoPercentage) / 100 || 0;
    return pif * percentage;
  };
  
  // Calculate Value Cap amount
  const calculateValueCap = () => {
    if (!selectedLoanData) return 0;
    
    // Get collateral value from the selected loan's collateral
    const loanCollateral = collateralData.find(c => 
      collateralLoanRelationships[c.id]?.[selectedLoan]
    );
    
    const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
    const percentage = parseFloat(exitValueCapPercentage) / 100 || 0;
    return collateralValue * percentage;
  };
  
  // Calculate Liquidation amount
  const calculateLiquidation = () => {
    if (!selectedLoanData) return 0;
    
    const rate = getProjectedRate() / 100 / 12; // Monthly rate
    const nper = parseInt(exitLiquidationMonths) || 0;
    const pv = selectedLoanData.principal;
    
    // FV = PV * (1 + rate)^nper (no payments)
    let fv = pv * Math.pow(1 + rate, nper);
    
    // Add current interest if selected
    if (exitLiquidationAddInterest) {
      const currentInterest = selectedLoanData.interest || 0;
      fv += currentInterest;
    }
    
    return fv;
  };
  
  // Calculate YTM Sell Solve - solve for sale price given desired YTM
  const calculateYtmSellSolve = () => {
    if (!selectedLoanData) return 0;
    
    const desiredYtm = parseFloat(exitYtmDesired) / 100 / 12 || 0; // Monthly YTM
    const payment = calculateProjectedPayment();
    const nper = parseInt(exitEndMonth) - parseInt(exitStartMonth) + 1;
    const fv = 0; // Assume paid off at maturity
    
    // Solve for PV (sale price) given payment, rate (YTM), nper, and fv
    // PV = Payment * [(1 - (1 + rate)^-nper) / rate] + FV / (1 + rate)^nper
    if (desiredYtm === 0) {
      return payment * nper;
    }
    
    const pv = payment * ((1 - Math.pow(1 + desiredYtm, -nper)) / desiredYtm) + fv / Math.pow(1 + desiredYtm, nper);
    return pv;
  };
  
  // Get the calculated exit value based on selected method
  const getCalculatedExitValue = () => {
    switch (exitMethod) {
      case 'Pay in Full':
        return calculatePayInFull();
      case 'DPO':
        return calculateDpo();
      case 'Value Cap':
        return calculateValueCap();
      case 'User Enter':
        return parseFloat(exitUserEnterAmount) || 0;
      case 'YTM Sell Solve':
        return calculateYtmSellSolve();
      case 'Liquidation':
        return calculateLiquidation();
      default:
        return 0;
    }
  };
  
  // ===== END EXITS STATE =====
  
  // Helper function to calculate months between two dates
  const calculateMonthsBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    
    // Parse dates - handle MM/DD/YY format
    const parseDate = (dateStr) => {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;
      
      let month = parseInt(parts[0]) - 1; // JavaScript months are 0-based
      let day = parseInt(parts[1]);
      let year = parseInt(parts[2]);
      
      // Handle 2-digit years
      if (year < 100) {
        year += year < 50 ? 2000 : 1900;
      }
      
      return new Date(year, month, day);
    };
    
    const start = parseDate(startDate);
    const end = parseDate(endDate);
    
    if (!start || !end) return 0;
    
    // Calculate the difference in months
    let months = (end.getFullYear() - start.getFullYear()) * 12;
    months += end.getMonth() - start.getMonth();
    
    // Add days consideration - if end day is before start day, subtract a month
    if (end.getDate() < start.getDate()) {
      months--;
    }
    
    return Math.floor(Math.max(0, months)); // Round down and ensure non-negative
  };
  
  // Calculate months of interest accrued using the formula:
  // Months = Interest Balance / (Principal Balance * (Rate/12))
  // This tells us how many months worth of interest have accumulated
  // For example: $108.72 interest / ($21,505.49 principal * (8.5%/12)) = ~0.71 months
  const calculateInterestAccrued = (interestBalance, principalBalance, interestRate) => {
    // Remove $ and commas from balances
    const cleanInterest = parseFloat(String(interestBalance).replace(/[$,]/g, '')) || 0;
    const cleanPrincipal = parseFloat(String(principalBalance).replace(/[$,]/g, '')) || 0;
    const cleanRate = parseFloat(String(interestRate).replace(/%/g, '')) || 0;
    
    // Avoid division by zero
    if (cleanPrincipal === 0 || cleanRate === 0) return '0.00';
    
    // Calculate monthly interest rate (convert percentage to decimal)
    const monthlyRate = (cleanRate / 100) / 12;
    
    // Calculate months of interest accrued
    const months = cleanInterest / (cleanPrincipal * monthlyRate);
    
    // Return with 2 decimal places
    return months.toFixed(2);
  };
  
  // Calculate months to maturity (from current date to MatDt)
  const calculateMonthsToMaturity = (maturityDate) => {
    const today = new Date();
    const todayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear() % 100}`;
    return calculateMonthsBetween(todayStr, maturityDate);
  };
  
  // Calculate months to amortization using NPER formula
  // NPER = -log(1 - (rate * PV / PMT)) / log(1 + rate)
  // Where: rate = annual rate / 12, PV = present value (principal balance), PMT = payment, FV = 0
  // This calculates how many monthly payments are needed to fully pay off the current principal balance
  // Example: $21,505.49 principal at 8.5% with $608.15 payment = ~41 months
  const calculateAmortizationMonths = (principalBalance, payment, annualRate) => {
    // Clean the input values
    const cleanPrincipal = parseFloat(String(principalBalance).replace(/[$,]/g, '')) || 0;
    const cleanPayment = parseFloat(String(payment).replace(/[$,]/g, '')) || 0;
    const cleanRate = parseFloat(String(annualRate).replace(/%/g, '')) || 0;
    
    // Avoid division by zero or invalid inputs
    if (cleanPayment === 0 || cleanRate === 0 || cleanPrincipal === 0) return 0;
    
    // Convert annual rate to monthly rate (as decimal)
    const monthlyRate = (cleanRate / 100) / 12;
    
    // Calculate the monthly interest amount
    const monthlyInterest = cleanPrincipal * monthlyRate;
    
    // Check if payment is less than monthly interest (loan will never be paid off)
    if (cleanPayment <= monthlyInterest) return 999; // Return max value to indicate infinite
    
    // NPER formula: -ln(1 - (rate * PV / PMT)) / ln(1 + rate)
    // Note: We use natural log (Math.log) in JavaScript
    const numerator = -Math.log(1 - (monthlyRate * cleanPrincipal / cleanPayment));
    const denominator = Math.log(1 + monthlyRate);
    
    const months = numerator / denominator;
    
    // Round down to nearest whole number
    return Math.floor(Math.max(0, months));
  };
  
  // Update payment grid data whenever payment records or selected loan changes
  React.useEffect(() => {
    const gridData = {};
    paymentRecords
      .filter(record => record.loanNo === selectedLoan)
      .forEach(record => {
        if (record.year && record.month && record.amount) {
          if (!gridData[record.year]) {
            gridData[record.year] = {};
          }
          gridData[record.year][parseInt(record.month)] = parseFloat(record.amount) || 0;
        }
      });
    setPaymentGridData(gridData);
  }, [paymentRecords, selectedLoan]);
  
  // Handle cell edit in payment history with validation
  const handleCellEdit = (id, field, value) => {
    // Validate month input
    if (field === 'month' && value !== '') {
      // Only allow digits
      if (!/^\d*$/.test(value)) return;
      // Limit to 2 characters
      if (value.length > 2) return;
      // Check if complete value is valid (1-12)
      if (value.length === 2 || (value.length === 1 && parseInt(value) > 1)) {
        const num = parseInt(value, 10);
        if (num < 1 || num > 12) return;
      }
    }

    // Validate year input
    if (field === 'year' && value !== '') {
      // Only allow digits
      if (!/^\d*$/.test(value)) return;
      // Limit to 4 characters
      if (value.length > 4) return;
    }

    setPaymentRecords(prev => {
      const recordIndex = prev.findIndex(r => r.id === id);
      if (recordIndex === -1) return prev;

      const newRecords = [...prev];
      const currentRecord = newRecords[recordIndex];

      // Check for duplicate entry (same year/month for same loan)
      if ((field === 'year' || field === 'month') && value) {
        const newYear = field === 'year' ? value : currentRecord.year;
        const newMonth = field === 'month' ? value : currentRecord.month;
        if (newYear && newMonth) {
          const isDuplicate = prev.some(
            r => r.loanNo === selectedLoan &&
                 r.year === newYear &&
                 r.month === newMonth &&
                 r.id !== id
          );
          if (isDuplicate) {
            // Optionally show warning - for now just allow but could add visual indicator
            console.warn(`Duplicate payment entry detected for ${newMonth}/${newYear}`);
          }
        }
      }

      // Update the record
      newRecords[recordIndex] = { ...currentRecord, [field]: value };

      // Check if this is the last empty row for this loan and user started typing
      const loanRecords = newRecords.filter(r => r.loanNo === selectedLoan);
      const isLastRecord = loanRecords[loanRecords.length - 1]?.id === id;
      const hasValue = value !== '';

      if (isLastRecord && hasValue) {
        // Add new empty row for this loan
        newRecords.push({
          id: getNextPaymentId(),
          loanNo: selectedLoan,
          year: '',
          month: '',
          amount: ''
        });
      }

      return newRecords;
    });
  };
  
  // Calculate expression in amount field - SECURE IMPLEMENTATION
  // Uses a safe tokenizer and parser instead of eval/Function
  const calculateExpression = (expression) => {
    try {
      // Remove spaces, dollar signs, and commas
      let expr = expression.replace(/[\s$,]/g, '');

      // Return original if empty or just a number
      if (!expr || /^-?\d+\.?\d*$/.test(expr)) {
        return expr ? parseFloat(expr).toFixed(2) : expression;
      }

      // Strict validation - only allow numbers, operators, parentheses, and decimal points
      if (!/^[0-9+\-*/().]+$/.test(expr)) {
        return expression;
      }

      // Safe tokenizer - breaks expression into numbers and operators
      const tokenize = (str) => {
        const tokens = [];
        let current = '';
        let i = 0;

        while (i < str.length) {
          const char = str[i];

          if ('0123456789.'.includes(char)) {
            current += char;
          } else if ('+-*/()'.includes(char)) {
            if (current) {
              tokens.push({ type: 'number', value: parseFloat(current) });
              current = '';
            }
            // Handle negative numbers at start or after operator/open paren
            if (char === '-' && (tokens.length === 0 ||
                tokens[tokens.length - 1].type === 'operator' ||
                tokens[tokens.length - 1].value === '(')) {
              current = '-';
            } else {
              tokens.push({ type: char === '(' || char === ')' ? 'paren' : 'operator', value: char });
            }
          }
          i++;
        }

        if (current) {
          tokens.push({ type: 'number', value: parseFloat(current) });
        }

        return tokens;
      };

      // Safe evaluator using shunting-yard algorithm
      const evaluate = (tokens) => {
        const outputQueue = [];
        const operatorStack = [];
        const precedence = { '+': 1, '-': 1, '*': 2, '/': 2 };

        for (const token of tokens) {
          if (token.type === 'number') {
            outputQueue.push(token.value);
          } else if (token.type === 'operator') {
            while (operatorStack.length > 0 &&
                   operatorStack[operatorStack.length - 1] !== '(' &&
                   precedence[operatorStack[operatorStack.length - 1]] >= precedence[token.value]) {
              outputQueue.push(operatorStack.pop());
            }
            operatorStack.push(token.value);
          } else if (token.value === '(') {
            operatorStack.push('(');
          } else if (token.value === ')') {
            while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
              outputQueue.push(operatorStack.pop());
            }
            operatorStack.pop(); // Remove the '('
          }
        }

        while (operatorStack.length > 0) {
          outputQueue.push(operatorStack.pop());
        }

        // Evaluate RPN
        const stack = [];
        for (const item of outputQueue) {
          if (typeof item === 'number') {
            stack.push(item);
          } else {
            const b = stack.pop();
            const a = stack.pop();
            switch (item) {
              case '+': stack.push(a + b); break;
              case '-': stack.push(a - b); break;
              case '*': stack.push(a * b); break;
              case '/': stack.push(b !== 0 ? a / b : 0); break;
            }
          }
        }

        return stack[0];
      };

      const tokens = tokenize(expr);
      const result = evaluate(tokens);

      return isNaN(result) || !isFinite(result) ? expression : result.toFixed(2);
    } catch (e) {
      return expression;
    }
  };
  
  // Handle blur event for amount field to calculate expression
  const handleAmountBlur = (id, value) => {
    const calculated = calculateExpression(value);
    if (calculated !== value) {
      handleCellEdit(id, 'amount', calculated);
    }
  };
  
  // Handle key navigation in editable table
  const handleKeyDown = (e, id, field) => {
    const filteredRecords = getFilteredPaymentRecords();
    const currentIndex = filteredRecords.findIndex(r => r.id === id);
    
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      // Move to next row, same field
      if (currentIndex < filteredRecords.length - 1) {
        const nextId = filteredRecords[currentIndex + 1].id;
        document.getElementById(`${field}-${nextId}`)?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      // Move to previous row, same field
      if (currentIndex > 0) {
        const prevId = filteredRecords[currentIndex - 1].id;
        document.getElementById(`${field}-${prevId}`)?.focus();
      }
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Tab moves to next field
      e.preventDefault();
      const fields = ['year', 'month', 'amount'];
      const fieldIndex = fields.indexOf(field);
      if (fieldIndex < fields.length - 1) {
        document.getElementById(`${fields[fieldIndex + 1]}-${id}`)?.focus();
      } else if (currentIndex < filteredRecords.length - 1) {
        // Move to first field of next row
        const nextId = filteredRecords[currentIndex + 1].id;
        document.getElementById(`year-${nextId}`)?.focus();
      }
    }
  };
  
  // Delete row from payment history
  const deletePaymentRow = (id) => {
    if (paymentRecords.length > 1) {
      setPaymentRecords(prev => prev.filter(record => record.id !== id));
    }
  };

  // Validate month input (1-12)
  const validateMonth = (value) => {
    if (!value) return true; // Allow empty
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 1 && num <= 12;
  };

  // Validate year input (reasonable range)
  const validateYear = (value) => {
    if (!value) return true; // Allow empty
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 1990 && num <= 2100;
  };

  // Check for duplicate payment entry
  const isDuplicatePayment = (year, month, excludeId) => {
    return paymentRecords.some(
      record =>
        record.loanNo === selectedLoan &&
        record.year === year &&
        record.month === month &&
        record.id !== excludeId &&
        year && month // Both must be non-empty
    );
  };

  // Export payment history to CSV
  const exportPaymentHistory = () => {
    const loanRecords = paymentRecords.filter(r => r.loanNo === selectedLoan && r.year && r.month && r.amount);
    if (loanRecords.length === 0) {
      alert('No payment records to export');
      return;
    }

    // Sort by year and month
    const sortedRecords = [...loanRecords].sort((a, b) => {
      const yearDiff = parseInt(a.year) - parseInt(b.year);
      if (yearDiff !== 0) return yearDiff;
      return parseInt(a.month) - parseInt(b.month);
    });

    // Create CSV content
    const headers = ['Loan Number', 'Year', 'Month', 'Amount'];
    const rows = sortedRecords.map(r => [
      selectedLoan,
      r.year,
      r.month,
      r.amount
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `payment_history_${selectedLoan}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Function to calculate year sum
  const calculateYearSum = (yearData) => {
    return Object.values(yearData || {})
      .reduce((sum, val) => sum + val, 0);
  };
  
  // Get next borrower ID
  const getNextBorrowerId = () => {
    return Math.max(...borrowersList.map(b => b.id), 0) + 1;
  };
  
  // Add new borrower
  const addNewBorrower = () => {
    // Create default loan relationships with all loans unchecked
    const defaultLoanRelationships = {};
    loans.forEach(loan => {
      defaultLoanRelationships[loan.mwLoanNo] = { selected: false, role: 'Borrower' };
    });

    const newBorrower = {
      id: getNextBorrowerId(),
      relationship: currentRelationship,
      name: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      dob: '',
      ssnEin: '',
      creditScore: '',
      creditScoreDate: '',
      bkStatus: 'none',
      bkChapter: '',
      bkCourtCase: '',
      bkCourtLocation: '',
      bkAssets: 'No Assets',
      type: 'Borrower',
      loanRelationships: defaultLoanRelationships
    };
    setBorrowersList(prev => [...prev, newBorrower]);
    setSelectedBorrowerId(newBorrower.id);
    // *** SQL CONNECTION POINT ***
    // INSERT INTO borrowers (relationship, name, address1, ...) VALUES (...)
  };
  
  // Show delete confirmation popup
  const showDeleteConfirmation = (id, name) => {
    setDeleteConfirmation({
      show: true,
      borrowerId: id,
      borrowerName: name
    });
  };
  
  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirmation({
      show: false,
      borrowerId: null,
      borrowerName: ''
    });
  };
  
  // Confirm and delete borrower
  const confirmDelete = () => {
    const id = deleteConfirmation.borrowerId;
    const relationshipBorrowers = getRelationshipBorrowers();
    if (relationshipBorrowers.length > 1) {
      setBorrowersList(prev => prev.filter(b => b.id !== id));
      if (selectedBorrowerId === id) {
        // Select first remaining borrower in this relationship
        const remaining = relationshipBorrowers.filter(b => b.id !== id);
        if (remaining.length > 0) {
          setSelectedBorrowerId(remaining[0].id);
        }
      }
      // *** SQL CONNECTION POINT ***
      // DELETE FROM borrowers WHERE borrower_id = {id}
      // Also delete relationships: DELETE FROM borrower_loan_relationships WHERE borrower_id = {id}
    }
    cancelDelete();
  };
  
  // Handle borrower data field changes
  const handleBorrowerFieldChange = (field, value) => {
    setBorrowersList(prev => prev.map(b => 
      b.id === selectedBorrowerId ? { ...b, [field]: value } : b
    ));
    // *** SQL CONNECTION POINT ***
    // UPDATE borrowers SET ${field} = {value} WHERE borrower_id = {selectedBorrowerId}
  };
  
  // Toggle loan relationship - now per-borrower
  const toggleLoanRelationship = (loanNo) => {
    setBorrowersList(prev => prev.map(borrower => {
      if (borrower.id === selectedBorrowerId) {
        return {
          ...borrower,
          loanRelationships: {
            ...borrower.loanRelationships,
            [loanNo]: {
              ...borrower.loanRelationships[loanNo],
              selected: !borrower.loanRelationships[loanNo]?.selected
            }
          }
        };
      }
      return borrower;
    }));
    // *** SQL CONNECTION POINT ***
    // If checked: INSERT INTO borrower_loan_relationships (borrower_id, loan_id, role) VALUES ({selectedBorrowerId}, {loan_id}, {role})
    // If unchecked: DELETE FROM borrower_loan_relationships WHERE borrower_id = {selectedBorrowerId} AND loan_id = {loan_id}
  };

  // Change loan relationship role (Borrower/Guarantor) - now per-borrower
  const changeLoanRole = (loanNo, role) => {
    setBorrowersList(prev => prev.map(borrower => {
      if (borrower.id === selectedBorrowerId) {
        return {
          ...borrower,
          loanRelationships: {
            ...borrower.loanRelationships,
            [loanNo]: {
              ...borrower.loanRelationships[loanNo],
              role: role
            }
          }
        };
      }
      return borrower;
    }));
    // *** SQL CONNECTION POINT ***
    // UPDATE borrower_loan_relationships SET role = {role} WHERE borrower_id = {selectedBorrowerId} AND loan_id = {loan_id}
  };

  // Helper to get current borrower's loan relationships
  const getCurrentBorrowerLoanRelationships = () => {
    const borrower = borrowersList.find(b => b.id === selectedBorrowerId);
    return borrower?.loanRelationships || {};
  };
  
  // Get collateral for selected loan
  const getCollateralForLoan = () => {
    return collateralList.filter(c => c.loanNo === selectedLoan);
  };
  
  // Get next collateral ID
  const getNextCollateralId = () => {
    return Math.max(...collateralList.map(c => c.id), 0) + 1;
  };
  
  // Add new collateral
  const addNewCollateral = () => {
    const newId = getNextCollateralId();
    const newCollateral = {
      id: newId,
      loanNo: selectedLoan,
      collateralCode: '',
      description: '',
      address1: '',
      city: '',
      state: '',
      zip: '',
      county: '',
      parcelId: '',
      taxes: '',
      delinquentTaxes: '',
      taxAssessedValue: '',
      taxMarketValue: '',
      sellerLienPosition: '',
      sellerLienAmount: '',
      titleLienPosition: '',
      titleLienAmount: '',
      listPrice: '',
      daysOnMarket: '',
      appraisedValue: '',
      appraisedDate: '',
      ourValue: '',
      ourValueDate: '',
      bpoValue: '',
      bpoDate: '',
      sqft: '',
      acres: '',
      yearBuilt: '',
      units: ''
    };
    setCollateralList(prev => [...prev, newCollateral]);
    
    // Initialize loan relationships for new collateral
    setCollateralLoanRelationships(prev => ({
      ...prev,
      [newId]: {
        '2461': false,
        '5091': false,
        '7855': false,
        '3685': false,
        '3205': false,
        '6826': false,
        '7758': selectedLoan === '7758'
      }
    }));
    
    setSelectedCollateralId(newId);
    // *** SQL CONNECTION POINT ***
    // INSERT INTO collateral (loan_id, collateral_code, ...) VALUES (...)
  };
  
  // Toggle collateral loan relationship
  const toggleCollateralLoanRelationship = (loanNo) => {
    setCollateralLoanRelationships(prev => ({
      ...prev,
      [selectedCollateralId]: {
        ...prev[selectedCollateralId],
        [loanNo]: !prev[selectedCollateralId]?.[loanNo]
      }
    }));
    // *** SQL CONNECTION POINT ***
    // If checked: INSERT INTO collateral_loan_relationships (collateral_id, loan_id) VALUES ({selectedCollateralId}, {loan_id})
    // If unchecked: DELETE FROM collateral_loan_relationships WHERE collateral_id = {selectedCollateralId} AND loan_id = {loan_id}
  };
  
  // Handle collateral field changes with validation
  const handleCollateralFieldChange = (field, value) => {
    // Validate numeric fields
    const numericFields = ['sqft', 'acres', 'yearBuilt', 'units'];
    if (numericFields.includes(field) && value !== '') {
      // Allow only numbers and decimal point for acres
      if (field === 'acres') {
        if (!/^\d*\.?\d*$/.test(value)) return;
      } else {
        // Other numeric fields - integers only
        if (!/^\d*$/.test(value)) return;
      }
    }

    // Validate year built (reasonable range)
    if (field === 'yearBuilt' && value !== '') {
      const num = parseInt(value, 10);
      if (value.length === 4 && (num < 1700 || num > 2100)) {
        return; // Invalid year
      }
    }

    // Validate lien positions (1, 2, or 3)
    if ((field === 'sellerLienPosition' || field === 'titleLienPosition') && value !== '') {
      if (!/^[1-3]?$/.test(value)) return;
    }

    setCollateralList(prev => prev.map(c =>
      c.id === selectedCollateralId ? { ...c, [field]: value } : c
    ));
    // *** SQL CONNECTION POINT ***
    // UPDATE collateral SET ${field} = {value} WHERE collateral_id = {selectedCollateralId}
  };
  
  // Show delete collateral confirmation
  const showDeleteCollateralConfirmation = (id, description) => {
    setDeleteCollateralConfirmation({
      show: true,
      collateralId: id,
      collateralDescription: description
    });
  };
  
  // Cancel collateral delete
  const cancelCollateralDelete = () => {
    setDeleteCollateralConfirmation({
      show: false,
      collateralId: null,
      collateralDescription: ''
    });
  };
  
  // Confirm and delete collateral
  const confirmCollateralDelete = () => {
    const id = deleteCollateralConfirmation.collateralId;
    const loanCollateral = getCollateralForLoan();
    if (loanCollateral.length > 1) {
      setCollateralList(prev => prev.filter(c => c.id !== id));
      if (selectedCollateralId === id) {
        const remaining = loanCollateral.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setSelectedCollateralId(remaining[0].id);
        }
      }
      // *** SQL CONNECTION POINT ***
      // DELETE FROM collateral WHERE collateral_id = {id}
    }
    cancelCollateralDelete();
  };
  
  // Get selected collateral data
  const selectedCollateral = collateralList.find(c => c.id === selectedCollateralId);
  
  // Calculate $/SF for a given value (whole number)
  const calculatePerSqft = (value, sqft) => {
    const cleanValue = parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    const cleanSqft = parseFloat(String(sqft).replace(/,/g, '')) || 0;
    if (cleanSqft === 0) return '0';
    return Math.round(cleanValue / cleanSqft).toLocaleString();
  };
  
  // Calculate $/Unit (with comma formatting)
  const calculatePerUnit = (value, units) => {
    const cleanValue = parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    const cleanUnits = parseFloat(String(units).replace(/,/g, '')) || 0;
    if (cleanUnits === 0) return '0';
    return Math.round(cleanValue / cleanUnits).toLocaleString();
  };
  
  // Calculate $/Acre (with comma formatting)
  const calculatePerAcre = (value, acres) => {
    const cleanValue = parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    const cleanAcres = parseFloat(String(acres).replace(/,/g, '')) || 0;
    if (cleanAcres === 0) return '0';
    return Math.round(cleanValue / cleanAcres).toLocaleString();
  };
  
  // *** SQL CONNECTION POINT ***
  // In a real application, this data would come from your SQL database
  // You would replace this with a useEffect hook that fetches data from your API:
  // 
  // useEffect(() => {
  //   fetch('/api/loans')
  //     .then(response => response.json())
  //     .then(data => setLoans(data));
  // }, []);
  //
  // The API endpoint would connect to your SQL database and run queries like:
  // SELECT * FROM loans WHERE relationship_id = 'Haskell'
  const [loans, setLoans] = useState([
    {
      relatedLoans: 'Haskell',
      mwLoanNo: '2461',
      borrowerName: 'Rocky Coast Real Estate Group LLC',
      origBalance: 300000,
      principal: 257454,
      interest: 6612,
      escrowBalance: 0,
      otherBalance: 0,
      intRate: 4.75,
      dRate: 4.75,
      pmt: 3522,
      escPmt: 0,
      pmtFreq: 'M',
      notDue: '09/12/25',
      lastPmt: '04/27/21',
      origDt: '05/27/46',
      matDt: '',
      accDt: '',
      dueDt: '',
      lastPdt: '',
      status: 'PA',
      change: 2.3,
      lastImportDate: '10/31/24',
      pool: '100',
      address1: '1200 Main Street',
      address2: '',
      city: 'Portland',
      state: 'ME',
      zip: '04102',
      rateType: 'Fixed',
      floor: '',
      ceiling: '',
      margin: '',
      chDt: '',
      chFrq: '',
      rateIndex: '',
      ahBhd: '#Typed',
      assetType: 'Multi-family',
      unfundedCommitment: ''
    },
    {
      relatedLoans: 'Haskell',
      mwLoanNo: '5091',
      borrowerName: 'Blaze Restaurant Group LLC',
      origBalance: 250000,
      principal: 249027,
      interest: 1668,
      escrowBalance: 0,
      otherBalance: 0,
      intRate: 7.75,
      dRate: 7.75,
      pmt: 10012,
      escPmt: 0,
      pmtFreq: 'M',
      notDue: '09/05/25',
      lastPmt: '12/23/21',
      origDt: '10/23/29',
      matDt: '',
      accDt: '',
      dueDt: '',
      lastPdt: '',
      status: 'FA',
      change: 0.8,
      lastImportDate: '10/31/24',
      pool: '100',
      address1: '123 Main Street',
      address2: 'Suite 200',
      city: 'Portland',
      state: 'ME',
      zip: '04101',
      rateType: 'Fixed',
      floor: '',
      ceiling: '',
      margin: '',
      chDt: '',
      chFrq: '',
      rateIndex: '',
      ahBhd: '#Typed',
      assetType: 'Commercial RE',
      unfundedCommitment: ''
    },
    {
      relatedLoans: 'Haskell',
      mwLoanNo: '7855',
      borrowerName: 'Rocky Coast Real Estate Group LLC',
      origBalance: 207250,
      principal: 204352,
      interest: 8632,
      escrowBalance: 0,
      otherBalance: 0,
      intRate: 8.25,
      dRate: 8.25,
      pmt: 2660,
      escPmt: 0,
      pmtFreq: 'M',
      notDue: '09/05/25',
      lastPmt: '09/28/22',
      origDt: '09/28/47',
      matDt: '',
      accDt: '',
      dueDt: '',
      lastPdt: '',
      status: 'FC',
      change: -1.2,
      lastImportDate: '10/31/24',
      pool: '100',
      address1: '789 Pine Street',
      address2: '',
      city: 'Portland',
      state: 'ME',
      zip: '04103',
      rateType: 'Fixed',
      floor: '',
      ceiling: '',
      margin: '',
      chDt: '',
      chFrq: '',
      rateIndex: '',
      ahBhd: '#Typed',
      assetType: 'Commercial RE',
      unfundedCommitment: ''
    },
    {
      relatedLoans: 'Haskell',
      mwLoanNo: '3685',
      borrowerName: 'Rocky Coast Real Estate Group LLC',
      origBalance: 252000,
      principal: 166900,
      interest: 4912,
      escrowBalance: 0,
      otherBalance: 0,
      intRate: 8.50,
      dRate: 8.50,
      pmt: 13577,
      escPmt: 0,
      pmtFreq: 'M',
      notDue: '09/15/25',
      lastPmt: '02/03/23',
      origDt: '10/03/27',
      matDt: '',
      accDt: '',
      dueDt: '',
      lastPdt: '',
      status: 'JG',
      change: -5.2,
      lastImportDate: '10/31/24',
      pool: '100',
      address1: '456 Oak Avenue',
      address2: '',
      city: 'Portland',
      state: 'ME',
      zip: '04102',
      rateType: 'Fixed',
      floor: '',
      ceiling: '',
      margin: '',
      chDt: '',
      chFrq: '',
      rateIndex: '',
      ahBhd: '#Typed',
      assetType: 'Residential',
      unfundedCommitment: ''
    },
    {
      relatedLoans: 'Haskell',
      mwLoanNo: '3205',
      borrowerName: 'Matthew Haskell',
      origBalance: 152500,
      principal: 117520,
      interest: 5102,
      escrowBalance: 0,
      otherBalance: 0,
      intRate: 8.50,
      dRate: 8.50,
      pmt: 3677,
      escPmt: 0,
      pmtFreq: 'M',
      notDue: '01/13/25',
      lastPmt: '12/06/17',
      origDt: '12/06/32',
      matDt: '',
      accDt: '',
      dueDt: '',
      lastPdt: '',
      status: 'LT',
      change: -8.3,
      lastImportDate: '10/31/24',
      pool: '100',
      address1: '321 Maple Drive',
      address2: '',
      city: 'Portland',
      state: 'ME',
      zip: '04101',
      rateType: 'Fixed',
      floor: '',
      ceiling: '',
      margin: '',
      chDt: '',
      chFrq: '',
      rateIndex: '',
      ahBhd: '#Typed',
      assetType: 'Residential',
      unfundedCommitment: ''
    },
    {
      relatedLoans: 'Haskell',
      mwLoanNo: '6826',
      borrowerName: 'Matthew Haskell',
      origBalance: 50000,
      principal: 49273,
      interest: 546,
      escrowBalance: 0,
      otherBalance: 0,
      intRate: 8.50,
      dRate: 8.50,
      pmt: 371,
      escPmt: 0,
      pmtFreq: 'M',
      notDue: '08/22/25',
      lastPmt: '09/18/17',
      origDt: '10/03/25',
      matDt: '',
      accDt: '',
      dueDt: '',
      lastPdt: '',
      status: '',
      change: 3.1,
      lastImportDate: '10/31/24',
      pool: '100',
      address1: '555 Cedar Lane',
      address2: '',
      city: 'Portland',
      state: 'ME',
      zip: '04103',
      rateType: 'Fixed',
      floor: '',
      ceiling: '',
      margin: '',
      chDt: '',
      chFrq: '',
      rateIndex: '',
      ahBhd: '#Typed',
      assetType: 'Land',
      unfundedCommitment: ''
    },
    {
      relatedLoans: 'Haskell',
      mwLoanNo: '7758',
      borrowerName: 'Blaze Restaurant Group LLC',
      origBalance: 32800,
      principal: 21505,
      interest: 108,
      escrowBalance: 0,
      otherBalance: 0,
      intRate: 8.50,
      dRate: 8.50,
      pmt: 608,
      escPmt: 0,
      pmtFreq: 'M',
      notDue: '09/05/25',
      lastPmt: '10/02/25',
      origDt: '08/05/22',
      matDt: '08/05/28',
      accDt: '',
      dueDt: '',
      lastPdt: '09/05/25',
      status: '',
      selected: true,
      change: 3.1,
      lastImportDate: '10/31/24',
      pool: '100',
      address1: 'PO Box 824',
      address2: '',
      city: 'Blue Hill',
      state: 'ME',
      zip: '04614',
      rateType: 'Fixed',
      floor: '',
      ceiling: '',
      margin: '',
      chDt: '',
      chFrq: '',
      rateIndex: '',
      ahBhd: '#Typed',
      assetType: 'Commercial RE',
      unfundedCommitment: ''
    }
  ]);

  // Handle loan field changes
  const handleLoanFieldChange = (field, value) => {
    setLoans(prev => prev.map(loan =>
      loan.mwLoanNo === selectedLoan ? { ...loan, [field]: value } : loan
    ));
  };

  // Find the full data for the currently selected loan
  // This searches through the loans array and returns the loan that matches selectedLoan
  const selectedLoanData = loans.find(loan => loan.mwLoanNo === selectedLoan);

  // Get the current relationship from selected loan
  const currentRelationship = selectedLoanData?.relatedLoans || 'Haskell';
  
  // Get borrowers filtered by current relationship
  const getRelationshipBorrowers = () => {
    return borrowersList.filter(b => b.relationship === currentRelationship);
  };
  
  // Get loans sorted by principal balance (largest to smallest)
  const getSortedLoans = () => {
    return [...loans]
      .filter(loan => loan.relatedLoans === currentRelationship)
      .sort((a, b) => b.principal - a.principal);
  };
  
  // Get selected borrower data
  const selectedBorrower = borrowersList.find(b => b.id === selectedBorrowerId);

  // Calculate trailing payment metrics
  const calculateTrailingPayments = (loanNo, months, lastImportDate) => {
    if (!lastImportDate) return null;
    
    // Parse last import date (MM/DD/YY format)
    const [endMonth, endDay, endYear] = lastImportDate.split('/');
    const endDate = new Date(2000 + parseInt(endYear), parseInt(endMonth) - 1, parseInt(endDay));
    
    // Calculate start date
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - months + 1);
    
    // Get payment records for this loan
    const loanPayments = paymentRecords.filter(p => p.loanNo === loanNo && p.year && p.month && p.amount);
    
    // Filter payments within the trailing period
    const trailingPayments = loanPayments.filter(p => {
      const paymentDate = new Date(parseInt(p.year), parseInt(p.month) - 1, 1);
      return paymentDate >= startDate && paymentDate <= endDate;
    });
    
    // Calculate actual total
    const actualTotal = trailingPayments.reduce((sum, p) => {
      const amount = parseFloat(String(p.amount).replace(/[$,]/g, '')) || 0;
      return sum + amount;
    }, 0);
    
    // Get loan data for contractual payment
    const loan = loans.find(l => l.mwLoanNo === loanNo);
    const contractualMonthly = loan ? loan.pmt : 0;
    const contractualTotal = contractualMonthly * months;
    
    // Calculate interest-only payment
    const interestOnlyMonthly = loan ? (loan.principal * (loan.intRate / 100) / 12) : 0;
    const interestOnlyTotal = interestOnlyMonthly * months;
    
    // Calculate percentages
    const percentOfContractual = contractualTotal > 0 ? (actualTotal / contractualTotal * 100) : 0;
    const percentOfInterestOnly = interestOnlyTotal > 0 ? (actualTotal / interestOnlyTotal * 100) : 0;
    
    // Calculate months paid (how many months worth of payments were made)
    const monthsPaidContractual = contractualMonthly > 0 ? (actualTotal / contractualMonthly) : 0;
    const monthsPaidInterest = interestOnlyMonthly > 0 ? (actualTotal / interestOnlyMonthly) : 0;
    
    return {
      actual: actualTotal,
      monthly: actualTotal / months,
      yearly: actualTotal * (12 / months),
      contractualTotal,
      contractualMonthly,
      interestOnlyTotal,
      interestOnlyMonthly,
      percentOfContractual,
      percentOfInterestOnly,
      monthsPaidContractual,
      monthsPaidInterest,
      paymentsReceived: trailingPayments.length,
      paymentsExpected: months
    };
  };

  // List of all tabs - in a real app, these might come from the database too
  const tabs = ['Loan', 'Borrower', 'Collateral', 'Comment', 'BPOTitleUCC', 'PayHist', 'FinStmts', 'Projections', 'Strategies', 'Tasks', 'Overview', 'Property'];

  // Helper function to determine text color based on loan status
  // This creates visual indicators for loan health
  const getStatusColor = (status) => {
    switch(status) {
      case 'PA': return theme === 'dark' ? 'text-green-400' : 'text-green-600';  // Performing Asset
      case 'FA': return theme === 'dark' ? 'text-green-400' : 'text-green-600';  // Fully Performing
      case 'FC': return theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'; // Foreclosure
      case 'JG': return theme === 'dark' ? 'text-orange-400' : 'text-orange-600'; // Judgment
      case 'LT': return theme === 'dark' ? 'text-red-400' : 'text-red-600';    // Litigation
      default: return theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
    }
  };
  
  // Theme-based style classes
  const styles = {
    // Backgrounds
    mainBg: theme === 'dark' ? 'bg-black' : 'bg-gray-50',
    headerBg: theme === 'dark' ? 'bg-zinc-900' : 'bg-white',
    sectionBg: theme === 'dark' ? 'bg-zinc-900' : 'bg-white',
    cardBg: theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-100',
    inputBg: theme === 'dark' ? 'bg-zinc-900' : 'bg-white',
    readOnlyBg: theme === 'dark' ? 'bg-zinc-700' : 'bg-gray-200',
    
    // Borders
    borderColor: theme === 'dark' ? 'border-zinc-800' : 'border-gray-200',
    inputBorder: theme === 'dark' ? 'border-zinc-600' : 'border-gray-300',
    focusBorder: theme === 'dark' ? 'focus:border-green-500' : 'focus:border-green-600',
    
    // Text colors
    textPrimary: theme === 'dark' ? 'text-white' : 'text-gray-900',
    textSecondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-700',
    textMuted: theme === 'dark' ? 'text-gray-400' : 'text-gray-500',
    textGreen: theme === 'dark' ? 'text-green-400' : 'text-green-600',
    textYellow: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
    
    // Hover states
    hoverBg: theme === 'dark' ? 'hover:bg-zinc-800/30' : 'hover:bg-gray-100',
    hoverText: theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900',
    buttonHover: theme === 'dark' ? 'hover:bg-zinc-600' : 'hover:bg-gray-300',
    
    // Active/Selected states
    selectedBg: theme === 'dark' ? 'bg-green-500/10' : 'bg-green-50',
    selectedHoverBg: theme === 'dark' ? 'hover:bg-green-500/15' : 'hover:bg-green-100',
    activeBg: theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-200',
    activeTabBg: theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100',
    inactiveTabBg: theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-50',
    
    // Special elements
    alertBg: theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50',
    alertBorder: theme === 'dark' ? 'border-red-800/30' : 'border-red-200',
    alertText: theme === 'dark' ? 'text-red-400' : 'text-red-600',
    
    // Table
    tableHeaderBg: theme === 'dark' ? 'bg-zinc-800/50' : 'bg-gray-100',
    
    // Menu bar
    menuBg: theme === 'dark' ? 'bg-zinc-900/50' : 'bg-gray-50',
  };

  // The return statement contains JSX - React's way of writing HTML-like code
  // Everything inside return() is what gets displayed on the screen
  return (
    // Main container - sets background color and minimum height
    <div className={`${styles.mainBg} min-h-screen ${styles.textPrimary} font-sans text-sm transition-colors duration-200`}>
      {/* Header section with logo and user controls */}
      <div className={`${styles.headerBg} ${styles.borderColor} border-b px-4 py-2`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {/* Logo icon using Lucide React icon library */}
              <div className="w-6 h-6 bg-green-500 rounded flex items-center justify-center">
                <TrendingUp size={16} className="text-white" />
              </div>
              <span className={styles.textSecondary}>frmLoanView - Midwest Due Diligence Database</span>
            </div>
          </div>
          {/* User action buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg ${styles.cardBg} ${styles.inputBorder} border transition-all duration-200 hover:scale-105`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun size={18} className={styles.textMuted} />
              ) : (
                <Moon size={18} className={styles.textMuted} />
              )}
            </button>
            <Bell size={18} className={`${styles.textMuted} cursor-pointer ${styles.hoverText} transition-colors`} />
            <Settings size={18} className={`${styles.textMuted} cursor-pointer ${styles.hoverText} transition-colors`} />
            <User size={18} className={`${styles.textMuted} cursor-pointer ${styles.hoverText} transition-colors`} />
          </div>
        </div>
      </div>

      {/* Menu Bar - These would trigger different views in a full application */}
      <div className={`${styles.menuBg} ${styles.borderColor} border-b px-4 py-1`}>
        <div className="flex items-center space-x-8">
          <button className={`${styles.textSecondary} ${styles.hoverText} transition-colors py-1`}>File</button>
          <button className={`${styles.textSecondary} ${styles.hoverText} transition-colors py-1`}>Home</button>
          <button className={`${styles.textSecondary} ${styles.hoverText} transition-colors py-1`}>Create</button>
          <button className={`${styles.textSecondary} ${styles.hoverText} transition-colors py-1`}>External Data</button>
          <button className={`${styles.textSecondary} ${styles.hoverText} transition-colors py-1`}>Database Tools</button>
          <button className={`${styles.textSecondary} ${styles.hoverText} transition-colors py-1`}>Help</button>
          {/* Search bar */}
          <div className="flex-1 flex items-center">
            <Search size={16} className={styles.textMuted} />
            <input 
              type="text" 
              placeholder="Tell me what you want to do"
              className={`flex-1 px-3 py-1.5 ${styles.inputBg} ${styles.inputBorder} border rounded ${styles.textPrimary} placeholder:${styles.textMuted} focus:outline-none ${styles.focusBorder} transition-colors ml-2`}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4">
        {/* Relationship Report Section - This shows all loans for a relationship */}
        <div className={`${styles.sectionBg} ${styles.borderColor} border rounded-lg mb-4 overflow-hidden`}>
          <div className={`${styles.activeBg} px-4 py-2 flex items-center justify-between`}>
            <div className="flex items-center space-x-6">
              {/* *** SQL CONNECTION POINT ***
                  This dropdown would be populated with:
                  SELECT DISTINCT relationship_name FROM relationships ORDER BY relationship_name
              */}
              <select className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-3 py-1 ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}>
                <option>Haskell</option>
              </select>
              <span className={`font-semibold ${styles.textPrimary}`}>Relationship Report</span>
              <div className="flex items-center space-x-2">
                <span className={styles.textMuted}>Sort:</span>
                <input type="text" value="1" className={`w-12 ${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 text-center ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`} />
              </div>
            </div>
            <button className={`px-4 py-1.5 ${styles.readOnlyBg} ${styles.buttonHover} ${styles.textPrimary} rounded transition-colors`}>
              Main Menu
            </button>
          </div>

          {/* Loans Table - Each row is clickable to select that loan */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${styles.tableHeaderBg} ${styles.borderColor} border-b`}>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>RelatedLoans</th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>MWLoanNo</th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Borrower Name</th>
                  <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Orig Balance</th>
                  <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Principal</th>
                  <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Interest</th>
                  <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium text-xs`}>IntRate</th>
                  <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium text-xs`}>DRate</th>
                  <th className={`text-right px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Pmt</th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>NotDue</th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>LastPmt</th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Orig Dt</th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Mat Dt</th>
                  <th className={`text-center px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Status</th>
                  <th className={`text-center px-3 py-2 ${styles.textMuted} font-medium text-xs`}>24h</th>
                </tr>
              </thead>
              <tbody>
                {/* map() is a JavaScript function that loops through each loan and creates a table row */}
                {loans.map((loan, idx) => (
                  <tr 
                    key={idx} // React needs a unique key for each item in a list
                    // Dynamic className - changes based on whether this loan is selected
                    className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                      loan.mwLoanNo === selectedLoan 
                        ? `${styles.selectedBg} ${styles.selectedHoverBg}` 
                        : styles.hoverBg
                    }`}
                    // onClick event handler - when user clicks a row, it updates selectedLoan
                    onClick={() => setSelectedLoan(loan.mwLoanNo)}
                  >
                    <td className={`px-3 py-2 ${styles.textSecondary}`}>{loan.relatedLoans}</td>
                    <td className="px-3 py-2 font-medium">{loan.mwLoanNo}</td>
                    <td className="px-3 py-2">{loan.borrowerName}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {/* toLocaleString() formats numbers with commas */}
                      ${loan.origBalance.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${loan.principal.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ${loan.interest.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">{loan.intRate}</td>
                    <td className="px-3 py-2 text-right">{loan.dRate}</td>
                    <td className="px-3 py-2 text-right">
                      ${loan.pmt.toLocaleString()}
                    </td>
                    <td className="px-3 py-2">{loan.notDue}</td>
                    <td className="px-3 py-2">{loan.lastPmt}</td>
                    <td className="px-3 py-2">{loan.origDt}</td>
                    <td className="px-3 py-2">{loan.matDt}</td>
                    <td className="px-3 py-2 text-center">
                      {/* Conditional rendering - only show checkbox if status exists */}
                      {loan.status && (
                        <span className={`inline-flex items-center ${getStatusColor(loan.status)}`}>
                          <input type="checkbox" checked readOnly className={`mr-1 rounded ${styles.inputBorder} ${styles.readOnlyBg}`} />
                          <span className="font-medium">{loan.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {/* Conditional coloring based on positive/negative change */}
                      <div className={`flex items-center justify-center ${
                        loan.change >= 0 ? styles.textGreen : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {loan.change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        <span className="ml-1 text-xs font-medium">{Math.abs(loan.change)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Low Yield Alert - Visual warning for portfolio issues */}
          <div className={`${styles.alertBg} ${styles.alertBorder} border-t px-4 py-2 flex items-center`}>
            <AlertCircle size={16} className={`${styles.alertText} mr-2`} />
            <span className={`${styles.alertText} font-semibold`}>Low Yield Alert</span>
          </div>
        </div>

        {/* Loan Details Section - Shows detailed info for selected loan */}
        <div className={`${styles.sectionBg} ${styles.borderColor} border rounded-lg overflow-hidden`}>
          {/* Tab Navigation */}
          <div className={`flex ${styles.borderColor} border-b overflow-x-auto`}>
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)} // Updates activeTab when clicked
                // Dynamic styling - active tab has different appearance
                className={`px-4 py-2 ${styles.borderColor} border-r transition-colors whitespace-nowrap ${
                  activeTab === tab 
                    ? `${styles.activeTabBg} ${styles.textPrimary}` 
                    : `${styles.inactiveTabBg} ${styles.textMuted} ${styles.hoverText} hover:${styles.activeTabBg}`
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Loan Tab Content - Only shows when 'Loan' tab is active */}
          {/* The && operator means "only render this if both conditions are true" */}
          {activeTab === 'Loan' && selectedLoanData && (
            <div className="p-4">
              {/* Grid layout - 5 columns total */}
              <div className="grid grid-cols-5 gap-4">
                {/* Left Column - Borrower Info (spans 2 columns) */}
                <div className="col-span-2 space-y-3">
                  {/* Loan Number and Relationship Info */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <label className={`w-20 text-xs ${styles.textMuted}`}>Loan Number:</label>
                        <input 
                          type="text" 
                          value={selectedLoan} 
                          maxLength="20"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-32 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          readOnly // Makes the input non-editable
                        />
                      </div>
                      
                      {/* *** SQL CONNECTION POINT ***
                          This Related field would link to:
                          SELECT relationship_name FROM relationships WHERE id = {loan.relationship_id}
                      */}
                      <div className="flex items-center space-x-2">
                        <label className={`w-20 text-xs ${styles.textMuted}`}>Related:</label>
                        <input
                          type="text"
                          value={selectedLoanData.relatedLoans || ''}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 flex-1 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          readOnly
                        />
                        <label className={`text-xs ${styles.textMuted}`}>Pool:</label>
                        <input
                          type="text"
                          value={selectedLoanData.pool || ''}
                          onChange={(e) => handleLoanFieldChange('pool', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-16 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Borrower Name and Address Information section */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    {/* *** SQL CONNECTION POINT ***
                        Borrower info would come from:
                        SELECT * FROM borrowers WHERE loan_id = {selectedLoan}
                    */}
                    <input 
                      type="text" 
                      value={selectedLoanData.borrowerName}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder} mb-3`}
                      readOnly
                    />
                    
                    {/* Editable Address Fields */}
                    <div className="space-y-2">
                      {/* Address Line 1 */}
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 1:</label>
                        <input
                          type="text"
                          value={selectedLoanData.address1 || ''}
                          onChange={(e) => handleLoanFieldChange('address1', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>

                      {/* Address Line 2 */}
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 2:</label>
                        <input
                          type="text"
                          value={selectedLoanData.address2 || ''}
                          onChange={(e) => handleLoanFieldChange('address2', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>

                      {/* City, State, Zip on one row */}
                      <div className="grid grid-cols-6 gap-2">
                        <div className="col-span-3">
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
                          <input
                            type="text"
                            value={selectedLoanData.city || ''}
                            onChange={(e) => handleLoanFieldChange('city', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div className="col-span-1">
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
                          <input
                            type="text"
                            value={selectedLoanData.state || ''}
                            onChange={(e) => handleLoanFieldChange('state', e.target.value.toUpperCase())}
                            maxLength="2"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
                          <input
                            type="text"
                            value={selectedLoanData.zip || ''}
                            onChange={(e) => handleLoanFieldChange('zip', e.target.value)}
                            maxLength="10"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Unfunded Commitment field - moved to left column */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    <div className="flex items-center space-x-2">
                      <label className={`text-xs ${styles.textMuted}`}>Unfunded Commitment:</label>
                      <input
                        type="text"
                        value={selectedLoanData.unfundedCommitment || ''}
                        onChange={(e) => handleLoanFieldChange('unfundedCommitment', e.target.value)}
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-24 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        placeholder="$0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column - Loan Details (spans 3 columns) */}
                <div className="col-span-3 space-y-3">
                  {/* All Date Fields Together - 3 columns */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Origination Date:</label>
                        <input
                          type="text"
                          value={selectedLoanData.origDt || ''}
                          onChange={(e) => handleLoanFieldChange('origDt', e.target.value)}
                          placeholder="MM/DD/YY"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Mat Dt:</label>
                        <input
                          type="text"
                          value={selectedLoanData.matDt || ''}
                          onChange={(e) => handleLoanFieldChange('matDt', e.target.value)}
                          placeholder="MM/DD/YY"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>LastPMT:</label>
                        <input
                          type="text"
                          value={selectedLoanData.lastPmt || ''}
                          onChange={(e) => handleLoanFieldChange('lastPmt', e.target.value)}
                          placeholder="MM/DD/YY"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Acc Dt:</label>
                        <input
                          type="text"
                          value={selectedLoanData.accDt || ''}
                          onChange={(e) => handleLoanFieldChange('accDt', e.target.value)}
                          placeholder="MM/DD/YY"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Due Dt:</label>
                        <input
                          type="text"
                          value={selectedLoanData.dueDt || ''}
                          onChange={(e) => handleLoanFieldChange('dueDt', e.target.value)}
                          placeholder="MM/DD/YY"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>LastPdt:</label>
                        <input
                          type="text"
                          value={selectedLoanData.lastPdt || ''}
                          onChange={(e) => handleLoanFieldChange('lastPdt', e.target.value)}
                          placeholder="MM/DD/YY"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div className="col-span-3">
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Last Import Date:</label>
                        <input
                          type="text"
                          value={selectedLoanData.lastImportDate || ''}
                          onChange={(e) => handleLoanFieldChange('lastImportDate', e.target.value)}
                          placeholder="MM/DD/YY"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                        />
                        <p className={`text-xs ${styles.textMuted} mt-1`}>End date for payment history analysis</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* All Balance Fields Together - 3 columns */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Origination Balance:</label>
                        <input
                          type="text"
                          value={selectedLoanData.origBalance ? `$${selectedLoanData.origBalance.toLocaleString()}` : ''}
                          onChange={(e) => handleLoanFieldChange('origBalance', parseFloat(e.target.value.replace(/[$,]/g, '')) || 0)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Principal Balance:</label>
                        <input
                          type="text"
                          value={selectedLoanData.principal ? `$${selectedLoanData.principal.toLocaleString()}` : ''}
                          onChange={(e) => handleLoanFieldChange('principal', parseFloat(e.target.value.replace(/[$,]/g, '')) || 0)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textGreen} font-medium focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Interest Balance:</label>
                        <input
                          type="text"
                          value={selectedLoanData.interest ? `$${selectedLoanData.interest.toLocaleString()}` : ''}
                          onChange={(e) => handleLoanFieldChange('interest', parseFloat(e.target.value.replace(/[$,]/g, '')) || 0)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Escrow Balance:</label>
                        <input
                          type="text"
                          value={selectedLoanData.escrowBalance ? `$${selectedLoanData.escrowBalance.toLocaleString()}` : ''}
                          onChange={(e) => handleLoanFieldChange('escrowBalance', parseFloat(e.target.value.replace(/[$,]/g, '')) || 0)}
                          placeholder="$0.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Other Balance:</label>
                        <input
                          type="text"
                          value={selectedLoanData.otherBalance ? `$${selectedLoanData.otherBalance.toLocaleString()}` : ''}
                          onChange={(e) => handleLoanFieldChange('otherBalance', parseFloat(e.target.value.replace(/[$,]/g, '')) || 0)}
                          placeholder="$0.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Payoff:</label>
                        <input
                          type="text"
                          value={selectedLoanData.principal && selectedLoanData.interest ? `$${(selectedLoanData.principal + selectedLoanData.interest + (selectedLoanData.escrowBalance || 0) + (selectedLoanData.otherBalance || 0)).toLocaleString()}` : ''}
                          className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                          readOnly
                          title="Calculated: Principal + Interest + Escrow + Other"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Information - 3 columns */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>PmtAmt:</label>
                        <input
                          type="text"
                          value={selectedLoanData.pmt ? `$${selectedLoanData.pmt.toLocaleString()}` : ''}
                          onChange={(e) => handleLoanFieldChange('pmt', parseFloat(e.target.value.replace(/[$,]/g, '')) || 0)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textGreen} font-semibold focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>EscPmt:</label>
                        <input
                          type="text"
                          value={selectedLoanData.escPmt ? `$${selectedLoanData.escPmt.toLocaleString()}` : ''}
                          onChange={(e) => handleLoanFieldChange('escPmt', parseFloat(e.target.value.replace(/[$,]/g, '')) || 0)}
                          placeholder="$0.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>PmtFrq:</label>
                        <select
                          value={selectedLoanData.pmtFreq || 'M'}
                          onChange={(e) => handleLoanFieldChange('pmtFreq', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        >
                          <option value="M">M</option>
                          <option value="Q">Q</option>
                          <option value="SA">SA</option>
                          <option value="A">A</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Rate Information - 3 columns */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Rate:</label>
                        <input
                          type="text"
                          value={selectedLoanData.intRate ? `${selectedLoanData.intRate}%` : ''}
                          onChange={(e) => handleLoanFieldChange('intRate', parseFloat(e.target.value.replace(/%/g, '')) || 0)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>DefR:</label>
                        <input
                          type="text"
                          value={selectedLoanData.dRate ? `${selectedLoanData.dRate}%` : ''}
                          onChange={(e) => handleLoanFieldChange('dRate', parseFloat(e.target.value.replace(/%/g, '')) || 0)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>RType:</label>
                        <select
                          value={selectedLoanData.rateType || 'Fixed'}
                          onChange={(e) => handleLoanFieldChange('rateType', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        >
                          <option value="Fixed">Fixed</option>
                          <option value="Variable">Variable</option>
                          <option value="Adjustable">Adjustable</option>
                        </select>
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Floor:</label>
                        <input
                          type="text"
                          value={selectedLoanData.floor || ''}
                          onChange={(e) => handleLoanFieldChange('floor', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          placeholder="0.0%"
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Ceiling:</label>
                        <input
                          type="text"
                          value={selectedLoanData.ceiling || ''}
                          onChange={(e) => handleLoanFieldChange('ceiling', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          placeholder="15.0%"
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Margin:</label>
                        <input
                          type="text"
                          value={selectedLoanData.margin || ''}
                          onChange={(e) => handleLoanFieldChange('margin', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          placeholder="2.0%"
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>ChDt:</label>
                        <input
                          type="text"
                          value={selectedLoanData.chDt || ''}
                          onChange={(e) => handleLoanFieldChange('chDt', e.target.value)}
                          placeholder="MM/DD/YY"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>ChFrq:</label>
                        <select
                          value={selectedLoanData.chFrq || ''}
                          onChange={(e) => handleLoanFieldChange('chFrq', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        >
                          <option value=""></option>
                          <option value="M">M</option>
                          <option value="Q">Q</option>
                          <option value="SA">SA</option>
                          <option value="A">A</option>
                        </select>
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Index:</label>
                        <select
                          value={selectedLoanData.rateIndex || ''}
                          onChange={(e) => handleLoanFieldChange('rateIndex', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        >
                          <option value=""></option>
                          <option value="LIBOR">LIBOR</option>
                          <option value="SOFR">SOFR</option>
                          <option value="Prime">Prime</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Loan Type Information - 3 columns with empty space */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Ah/Bhd:</label>
                        <input
                          type="text"
                          value={selectedLoanData.ahBhd || ''}
                          onChange={(e) => handleLoanFieldChange('ahBhd', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>AssetType:</label>
                        <select
                          value={selectedLoanData.assetType || ''}
                          onChange={(e) => handleLoanFieldChange('assetType', e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        >
                          <option value=""></option>
                          <option value="Commercial RE">Commercial RE</option>
                          <option value="Residential">Residential</option>
                          <option value="Multi-family">Multi-family</option>
                          <option value="Land">Land</option>
                          <option value="Construction">Construction</option>
                        </select>
                      </div>
                      <div>
                        {/* Empty cell for consistent 3-column layout */}
                      </div>
                    </div>
                  </div>
                  
                  {/* Calculated Fields - Local calculations, not stored in database */}
                  <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Months Interest Accrued:</label>
                        <input 
                          type="text" 
                          value={selectedLoanData ? calculateInterestAccrued(selectedLoanData.interest, selectedLoanData.principal, selectedLoanData.intRate) : '0.00'}
                          className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                          readOnly
                          title="Interest Balance ÷ (Principal Balance × (Rate÷12))"
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Months to Maturity:</label>
                        <input 
                          type="text" 
                          value={selectedLoanData && selectedLoanData.matDt ? calculateMonthsToMaturity(selectedLoanData.matDt) : '0'}
                          className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                          readOnly
                          title="Calculated from Today to Maturity Date"
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Months to Amortization:</label>
                        <input 
                          type="text" 
                          value={selectedLoanData ? calculateAmortizationMonths(selectedLoanData.principal, selectedLoanData.pmt, selectedLoanData.intRate) : '0'}
                          className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                          readOnly
                          title="NPER calculation: Months to pay off principal at current payment rate"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Borrower Tab Content - Borrower information and loan relationships */}
          {activeTab === 'Borrower' && (
            <div className="p-4">
              {/* Top Section - Borrowers/Guarantors Table */}
              <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`font-medium ${styles.textPrimary}`}>Borrowers & Guarantors</h3>
                    <p className={`text-xs ${styles.textMuted} mt-0.5`}>Relationship: {currentRelationship}</p>
                  </div>
                  <button
                    onClick={addNewBorrower}
                    className={`px-3 py-1.5 ${styles.inputBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-xs ${styles.buttonHover}`}
                  >
                    + Add New
                  </button>
                </div>
                
                {/* Borrowers Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`${styles.borderColor} border-b`}>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Name</th>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Phone</th>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Address</th>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>City, State</th>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>SSN/EIN</th>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Credit Score</th>
                        <th className={`text-center px-2 py-2 ${styles.textMuted} font-medium`}>BK Status</th>
                        <th className={`text-center px-2 py-2 ${styles.textMuted} font-medium`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getRelationshipBorrowers().map((borrower) => (
                        <tr 
                          key={borrower.id}
                          onClick={() => setSelectedBorrowerId(borrower.id)}
                          className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                            selectedBorrowerId === borrower.id ? styles.activeTabBg : styles.hoverText
                          }`}
                        >
                          <td className={`px-2 py-2 ${styles.textPrimary} font-medium`}>{borrower.name || '(New)'}</td>
                          <td className={`px-2 py-2 ${styles.textSecondary}`}>{borrower.phone}</td>
                          <td className={`px-2 py-2 ${styles.textSecondary}`}>{borrower.address1}</td>
                          <td className={`px-2 py-2 ${styles.textSecondary}`}>{borrower.city}{borrower.city && borrower.state ? ', ' : ''}{borrower.state}</td>
                          <td className={`px-2 py-2 ${styles.textSecondary}`} title="SSN/EIN masked for security">{maskSsnEin(borrower.ssnEin)}</td>
                          <td className={`px-2 py-2 ${styles.textSecondary}`}>{borrower.creditScore}</td>
                          <td className={`px-2 py-2 text-center`}>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              borrower.bkStatus === 'none' ? `${styles.textMuted}` :
                              borrower.bkStatus === 'open' ? 'bg-red-500/20 text-red-400' :
                              borrower.bkStatus === 'dismissed' ? 'bg-yellow-500/20 text-yellow-400' :
                              borrower.bkStatus === 'discharged' ? 'bg-green-500/20 text-green-400' :
                              borrower.bkStatus === 'terminated' ? 'bg-gray-500/20 text-gray-400' :
                              `${styles.textMuted}`
                            }`}>
                              {borrower.bkStatus === 'none' ? 'None' : 
                               borrower.bkStatus === 'open' ? 'Open' : 
                               borrower.bkStatus === 'dismissed' ? 'Dismissed' :
                               borrower.bkStatus === 'discharged' ? 'Discharged' :
                               borrower.bkStatus === 'terminated' ? 'Terminated' : 'None'}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteConfirmation(borrower.id, borrower.name);
                              }}
                              className={`${styles.textMuted} hover:text-red-500 transition-colors`}
                              disabled={getRelationshipBorrowers().length === 1}
                              title={getRelationshipBorrowers().length === 1 ? "Cannot delete last borrower" : "Delete borrower"}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Bottom Section - Selected Borrower Details */}
              {selectedBorrower && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column - Borrower Information */}
                  <div className="space-y-4">
                    <h3 className={`font-medium ${styles.textPrimary} mb-3`}>
                      Borrower/Guarantor Details
                    </h3>
                    
                    {/* Name */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Name:</label>
                      <input 
                        type="text" 
                        value={selectedBorrower.name}
                        onChange={(e) => handleBorrowerFieldChange('name', e.target.value)}
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                    
                    {/* Contact Information */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Contact Information</h4>
                      <div className="space-y-2">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Phone:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.phone}
                            onChange={(e) => handleBorrowerFieldChange('phone', e.target.value)}
                            placeholder="(555) 555-5555"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 1:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.address1}
                            onChange={(e) => handleBorrowerFieldChange('address1', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 2:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.address2}
                            onChange={(e) => handleBorrowerFieldChange('address2', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          <div className="col-span-3">
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
                            <input 
                              type="text" 
                              value={selectedBorrower.city}
                              onChange={(e) => handleBorrowerFieldChange('city', e.target.value)}
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            />
                          </div>
                          <div className="col-span-1">
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
                            <input 
                              type="text" 
                              value={selectedBorrower.state}
                              onChange={(e) => handleBorrowerFieldChange('state', e.target.value)}
                              maxLength="2"
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
                            <input 
                              type="text" 
                              value={selectedBorrower.zip}
                              onChange={(e) => handleBorrowerFieldChange('zip', e.target.value)}
                              maxLength="10"
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Identity Verification */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Identity Verification</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>SSN/EIN:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.ssnEin}
                            onChange={(e) => handleBorrowerFieldChange('ssnEin', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Date of Birth:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.dob}
                            onChange={(e) => handleBorrowerFieldChange('dob', e.target.value)}
                            placeholder="MM/DD/YYYY"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Credit Information */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Credit Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Credit Score:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.creditScore}
                            onChange={(e) => handleBorrowerFieldChange('creditScore', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Credit Score Date:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.creditScoreDate}
                            onChange={(e) => handleBorrowerFieldChange('creditScoreDate', e.target.value)}
                            placeholder="MM/DD/YY"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Bankruptcy Information */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Bankruptcy Information</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Status:</label>
                            <select 
                              value={selectedBorrower.bkStatus}
                              onChange={(e) => handleBorrowerFieldChange('bkStatus', e.target.value)}
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            >
                              <option value="none">None</option>
                              <option value="open">Open</option>
                              <option value="dismissed">Dismissed</option>
                              <option value="discharged">Discharged</option>
                              <option value="terminated">Terminated</option>
                            </select>
                          </div>
                          <div>
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Chapter:</label>
                            <select 
                              value={selectedBorrower.bkChapter}
                              onChange={(e) => handleBorrowerFieldChange('bkChapter', e.target.value)}
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                              disabled={selectedBorrower.bkStatus === 'none'}
                            >
                              <option value="">Select Chapter</option>
                              <option value="Chapter 7">Chapter 7</option>
                              <option value="Chapter 11">Chapter 11</option>
                              <option value="Chapter 12">Chapter 12</option>
                              <option value="Chapter 13">Chapter 13</option>
                              <option value="Chapter 15">Chapter 15</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Court Case #:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.bkCourtCase}
                            onChange={(e) => handleBorrowerFieldChange('bkCourtCase', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            disabled={selectedBorrower.bkStatus === 'none'}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Court Location:</label>
                          <input 
                            type="text" 
                            value={selectedBorrower.bkCourtLocation}
                            onChange={(e) => handleBorrowerFieldChange('bkCourtLocation', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            disabled={selectedBorrower.bkStatus === 'none'}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>BK Assets:</label>
                          <select 
                            value={selectedBorrower.bkAssets}
                            onChange={(e) => handleBorrowerFieldChange('bkAssets', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            disabled={selectedBorrower.bkStatus === 'none'}
                          >
                            <option value="No Assets">No Assets</option>
                            <option value="Assets">Assets</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Loan Relationships */}
                  <div className="space-y-4">
                    <h3 className={`font-medium ${styles.textPrimary} mb-3`}>Related Loans</h3>
                    
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <p className={`text-xs ${styles.textMuted} mb-3`}>
                        Select loans and specify role for this borrower:
                      </p>

                      <div className="space-y-1 max-h-[500px] overflow-y-auto">
                        {getSortedLoans().map((loan) => {
                          const borrowerLoanRels = getCurrentBorrowerLoanRelationships();
                          const loanRel = borrowerLoanRels[loan.mwLoanNo] || { selected: false, role: 'Borrower' };
                          return (
                            <div
                              key={loan.mwLoanNo}
                              className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
                                loanRel.selected ? styles.activeTabBg : styles.inactiveTabBg
                              }`}
                            >
                              <input
                                type="checkbox"
                                id={`loan-${loan.mwLoanNo}`}
                                checked={loanRel.selected || false}
                                onChange={() => toggleLoanRelationship(loan.mwLoanNo)}
                                className="mr-2"
                              />
                              <label
                                htmlFor={`loan-${loan.mwLoanNo}`}
                                className="flex-shrink-0 cursor-pointer"
                              >
                                <div className={`font-medium ${styles.textPrimary} text-xs`}>
                                  #{loan.mwLoanNo}
                                </div>
                              </label>
                              <div className="flex-1 flex items-center justify-between ml-3">
                                <div className="flex items-center space-x-2">
                                  <span className={`${styles.textGreen} font-medium text-xs`}>
                                    ${loan.principal.toLocaleString()}
                                  </span>
                                  <span className={`${styles.textMuted} text-xs`}>
                                    @ {loan.intRate}%
                                  </span>
                                </div>
                                <select
                                  value={loanRel.role}
                                  onChange={(e) => changeLoanRole(loan.mwLoanNo, e.target.value)}
                                  disabled={!loanRel.selected}
                                  className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-0.5 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="Borrower">Borrower</option>
                                  <option value="Guarantor">Guarantor</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Summary */}
                      <div className={`mt-4 pt-3 ${styles.borderColor} border-t`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs ${styles.textMuted}`}>Selected Loans:</span>
                          <span className={`text-xs font-medium ${styles.textPrimary}`}>
                            {Object.values(getCurrentBorrowerLoanRelationships()).filter(r => r?.selected).length} of {getSortedLoans().length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs ${styles.textMuted}`}>Total Exposure:</span>
                          <span className={`text-xs font-medium ${styles.textGreen}`}>
                            ${getSortedLoans()
                              .filter(loan => getCurrentBorrowerLoanRelationships()[loan.mwLoanNo]?.selected)
                              .reduce((sum, loan) => sum + loan.principal, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`text-xs ${styles.textMuted}`}>As Borrower:</span>
                          <span className={`text-xs ${styles.textPrimary}`}>
                            {Object.entries(getCurrentBorrowerLoanRelationships()).filter(([_, r]) => r?.selected && r?.role === 'Borrower').length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`text-xs ${styles.textMuted}`}>As Guarantor:</span>
                          <span className={`text-xs ${styles.textPrimary}`}>
                            {Object.entries(getCurrentBorrowerLoanRelationships()).filter(([_, r]) => r?.selected && r?.role === 'Guarantor').length}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* SQL Connection Info */}
                    <div className={`${styles.alertBg} ${styles.alertBorder} rounded-lg border p-3`}>
                      <div className="flex items-start">
                        <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
                        <div className={`text-xs ${styles.alertText}`}>
                          <p className="font-medium">SQL Connection Points:</p>
                          <p className="mt-1">• SELECT * FROM borrowers WHERE relationship = '{currentRelationship}'</p>
                          <p>• INSERT INTO borrowers (relationship, ...) VALUES ('{currentRelationship}', ...)</p>
                          <p>• UPDATE borrowers SET field = value WHERE id = {selectedBorrowerId}</p>
                          <p>• DELETE FROM borrowers WHERE id = borrower_id</p>
                          <p className="mt-2">Relationships:</p>
                          <p>• SELECT * FROM borrower_loan_relationships WHERE borrower_id = {selectedBorrowerId}</p>
                          <p>• INSERT INTO borrower_loan_relationships (borrower_id, loan_id, role) VALUES (...)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Delete Confirmation Modal */}
              {deleteConfirmation.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className={`${styles.sectionBg} rounded-lg p-6 max-w-md w-full mx-4 ${styles.borderColor} border`}>
                    <h3 className={`text-lg font-medium ${styles.textPrimary} mb-4`}>Confirm Delete</h3>
                    <p className={`${styles.textSecondary} mb-6`}>
                      Are you sure you want to delete <span className="font-medium">{deleteConfirmation.borrowerName || '(New)'}</span>?
                      <br />
                      <span className="text-xs mt-2 block">This will also remove all loan relationships for this borrower.</span>
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={cancelDelete}
                        className={`px-4 py-2 ${styles.cardBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-sm ${styles.buttonHover}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Collateral Tab Content - Property and collateral information */}
          {activeTab === 'Collateral' && (
            <div className="p-4">
              {/* Top Section - Collateral Table */}
              <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className={`font-medium ${styles.textPrimary}`}>Collateral Items</h3>
                    <p className={`text-xs ${styles.textMuted} mt-0.5`}>Loan #{selectedLoan}</p>
                  </div>
                  <button
                    onClick={addNewCollateral}
                    className={`px-3 py-1.5 ${styles.inputBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-xs ${styles.buttonHover}`}
                  >
                    + Add Collateral
                  </button>
                </div>
                
                {/* Collateral Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className={`${styles.borderColor} border-b`}>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Type</th>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Description</th>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>Address</th>
                        <th className={`text-left px-2 py-2 ${styles.textMuted} font-medium`}>City, State</th>
                        <th className={`text-right px-2 py-2 ${styles.textMuted} font-medium`}>Our Value</th>
                        <th className={`text-right px-2 py-2 ${styles.textMuted} font-medium`}>Appraised</th>
                        <th className={`text-center px-2 py-2 ${styles.textMuted} font-medium`}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCollateralForLoan().map((collateral) => (
                        <tr 
                          key={collateral.id}
                          onClick={() => setSelectedCollateralId(collateral.id)}
                          className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                            selectedCollateralId === collateral.id ? styles.activeTabBg : styles.hoverText
                          }`}
                        >
                          <td className={`px-2 py-2 ${styles.textPrimary}`}>
                            <span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">
                              {collateral.collateralCode || 'N/A'}
                            </span>
                          </td>
                          <td className={`px-2 py-2 ${styles.textPrimary} font-medium`}>{collateral.description || '(New)'}</td>
                          <td className={`px-2 py-2 ${styles.textSecondary}`}>{collateral.address1}</td>
                          <td className={`px-2 py-2 ${styles.textSecondary}`}>
                            {collateral.city}{collateral.city && collateral.state ? ', ' : ''}{collateral.state}
                          </td>
                          <td className={`px-2 py-2 text-right ${styles.textGreen} font-medium`}>
                            {collateral.ourValue ? `$${parseFloat(String(collateral.ourValue).replace(/,/g, '')).toLocaleString()}` : '-'}
                          </td>
                          <td className={`px-2 py-2 text-right ${styles.textSecondary}`}>
                            {collateral.appraisedValue ? `$${parseFloat(String(collateral.appraisedValue).replace(/,/g, '')).toLocaleString()}` : '-'}
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteCollateralConfirmation(collateral.id, collateral.description);
                              }}
                              className={`${styles.textMuted} hover:text-red-500 transition-colors`}
                              disabled={getCollateralForLoan().length === 1}
                              title={getCollateralForLoan().length === 1 ? "Cannot delete last collateral" : "Delete collateral"}
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Bottom Section - Selected Collateral Details */}
              {selectedCollateral && (
                <div className="grid grid-cols-2 gap-4">
                  {/* Left Column - Collateral Details */}
                  <div className="space-y-4">
                    <h3 className={`font-medium ${styles.textPrimary} mb-3`}>Collateral Details</h3>
                    
                    {/* Collateral Identification */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Identification</h4>
                      <div className="space-y-2">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Collateral Code:</label>
                          <select
                            value={selectedCollateral.collateralCode}
                            onChange={(e) => handleCollateralFieldChange('collateralCode', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          >
                            <option value="">Select Type</option>
                            <option value="Commercial Property">Commercial Property</option>
                            <option value="Residential Property">Residential Property</option>
                            <option value="Multi-Family">Multi-Family</option>
                            <option value="Land">Land</option>
                            <option value="Mixed Use">Mixed Use</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Retail">Retail</option>
                            <option value="Office">Office</option>
                            <option value="Special Purpose">Special Purpose</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Description:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.description}
                            onChange={(e) => handleCollateralFieldChange('description', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Property Address */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Property Address</h4>
                      <div className="space-y-2">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Address 1:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.address1}
                            onChange={(e) => handleCollateralFieldChange('address1', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div className="grid grid-cols-6 gap-2">
                          <div className="col-span-3">
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>City:</label>
                            <input 
                              type="text" 
                              value={selectedCollateral.city}
                              onChange={(e) => handleCollateralFieldChange('city', e.target.value)}
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            />
                          </div>
                          <div className="col-span-1">
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>State:</label>
                            <select
                              value={selectedCollateral.state}
                              onChange={(e) => handleCollateralFieldChange('state', e.target.value)}
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            >
                              {US_STATES.map(state => (
                                <option key={state.code} value={state.code}>{state.code || '-'}</option>
                              ))}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>Zip:</label>
                            <input 
                              type="text" 
                              value={selectedCollateral.zip}
                              onChange={(e) => handleCollateralFieldChange('zip', e.target.value)}
                              maxLength="10"
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>County:</label>
                            <input 
                              type="text" 
                              value={selectedCollateral.county}
                              onChange={(e) => handleCollateralFieldChange('county', e.target.value)}
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            />
                          </div>
                          <div>
                            <label className={`text-xs ${styles.textMuted} block mb-1`}>Parcel ID:</label>
                            <input 
                              type="text" 
                              value={selectedCollateral.parcelId}
                              onChange={(e) => handleCollateralFieldChange('parcelId', e.target.value)}
                              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Property Details */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Property Details</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>SQFT:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.sqft}
                            onChange={(e) => handleCollateralFieldChange('sqft', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Acres:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.acres}
                            onChange={(e) => handleCollateralFieldChange('acres', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Year Built:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.yearBuilt}
                            onChange={(e) => handleCollateralFieldChange('yearBuilt', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}># of Units:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.units}
                            onChange={(e) => handleCollateralFieldChange('units', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Tax Information */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Tax Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Taxes:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.taxes}
                            onChange={(e) => handleCollateralFieldChange('taxes', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Delinquent Taxes:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.delinquentTaxes}
                            onChange={(e) => handleCollateralFieldChange('delinquentTaxes', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Tax Assessed Value:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.taxAssessedValue}
                            onChange={(e) => handleCollateralFieldChange('taxAssessedValue', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Tax Market Value:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.taxMarketValue}
                            onChange={(e) => handleCollateralFieldChange('taxMarketValue', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Lien Information */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-2`}>Lien Information</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Seller Lien Position:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.sellerLienPosition}
                            onChange={(e) => handleCollateralFieldChange('sellerLienPosition', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Seller Lien Amount:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.sellerLienAmount}
                            onChange={(e) => handleCollateralFieldChange('sellerLienAmount', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Title Lien Position:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.titleLienPosition}
                            onChange={(e) => handleCollateralFieldChange('titleLienPosition', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Title Lien Amount:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.titleLienAmount}
                            onChange={(e) => handleCollateralFieldChange('titleLienAmount', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Valuations and Calculations */}
                  <div className="space-y-4">
                    <h3 className={`font-medium ${styles.textPrimary} mb-3`}>Valuations & Metrics</h3>
                    
                    {/* Combined Valuations and Metrics - 4 Column Layout */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Property Valuations & Metrics</h4>
                      
                      <div className="grid grid-cols-4 gap-3">
                        {/* Column Headers */}
                        <div className="text-center">
                          <p className={`text-xs ${styles.textMuted} font-medium mb-2`}>List Price</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs ${styles.textMuted} font-medium mb-2`}>Appraised</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs ${styles.textGreen} font-medium mb-2`}>Our Value</p>
                        </div>
                        <div className="text-center">
                          <p className={`text-xs ${styles.textMuted} font-medium mb-2`}>BPO</p>
                        </div>
                        
                        {/* Value Row */}
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Value:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.listPrice}
                            onChange={(e) => handleCollateralFieldChange('listPrice', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Value:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.appraisedValue}
                            onChange={(e) => handleCollateralFieldChange('appraisedValue', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Value:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.ourValue}
                            onChange={(e) => handleCollateralFieldChange('ourValue', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textGreen} font-medium focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Value:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.bpoValue}
                            onChange={(e) => handleCollateralFieldChange('bpoValue', e.target.value)}
                            placeholder="$0.00"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        
                        {/* Days on Market / Date Row */}
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Days on Market:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.daysOnMarket}
                            onChange={(e) => handleCollateralFieldChange('daysOnMarket', e.target.value)}
                            placeholder="0"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Date:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.appraisedDate}
                            onChange={(e) => handleCollateralFieldChange('appraisedDate', e.target.value)}
                            placeholder="MM/DD/YY"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Date:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.ourValueDate}
                            onChange={(e) => handleCollateralFieldChange('ourValueDate', e.target.value)}
                            placeholder="MM/DD/YY"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Date:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.bpoDate}
                            onChange={(e) => handleCollateralFieldChange('bpoDate', e.target.value)}
                            placeholder="MM/DD/YY"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        
                        {/* $/SF Row */}
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.listPrice && selectedCollateral.sqft ? 
                              `$${calculatePerSqft(selectedCollateral.listPrice, selectedCollateral.sqft)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.appraisedValue && selectedCollateral.sqft ? 
                              `$${calculatePerSqft(selectedCollateral.appraisedValue, selectedCollateral.sqft)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.ourValue && selectedCollateral.sqft ? 
                              `$${calculatePerSqft(selectedCollateral.ourValue, selectedCollateral.sqft)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/SF:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.bpoValue && selectedCollateral.sqft ? 
                              `$${calculatePerSqft(selectedCollateral.bpoValue, selectedCollateral.sqft)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        
                        {/* $/Unit Row */}
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/Unit:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.listPrice && selectedCollateral.units ? 
                              `$${calculatePerUnit(selectedCollateral.listPrice, selectedCollateral.units)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/Unit:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.appraisedValue && selectedCollateral.units ? 
                              `$${calculatePerUnit(selectedCollateral.appraisedValue, selectedCollateral.units)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/Unit:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.ourValue && selectedCollateral.units ? 
                              `$${calculatePerUnit(selectedCollateral.ourValue, selectedCollateral.units)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/Unit:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.bpoValue && selectedCollateral.units ? 
                              `$${calculatePerUnit(selectedCollateral.bpoValue, selectedCollateral.units)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        
                        {/* $/Acre Row */}
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/Acre:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.listPrice && selectedCollateral.acres ? 
                              `$${calculatePerAcre(selectedCollateral.listPrice, selectedCollateral.acres)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/Acre:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.appraisedValue && selectedCollateral.acres ? 
                              `$${calculatePerAcre(selectedCollateral.appraisedValue, selectedCollateral.acres)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/Acre:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.ourValue && selectedCollateral.acres ? 
                              `$${calculatePerAcre(selectedCollateral.ourValue, selectedCollateral.acres)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>$/Acre:</label>
                          <input 
                            type="text" 
                            value={selectedCollateral.bpoValue && selectedCollateral.acres ? 
                              `$${calculatePerAcre(selectedCollateral.bpoValue, selectedCollateral.acres)}` : '$0'}
                            className={`${styles.readOnlyBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textYellow} font-medium focus:outline-none cursor-not-allowed`}
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Related Loans */}
                    <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border`}>
                      <h4 className={`text-xs ${styles.textMuted} font-medium mb-3`}>Related Loans</h4>
                      <p className={`text-xs ${styles.textMuted} mb-3`}>
                        Select which loans this collateral secures:
                      </p>
                      
                      <div className="space-y-1 max-h-[300px] overflow-y-auto">
                        {getSortedLoans().map((loan) => (
                          <div 
                            key={loan.mwLoanNo}
                            className={`flex items-center p-2 rounded ${styles.inputBorder} border transition-colors ${
                              collateralLoanRelationships[selectedCollateralId]?.[loan.mwLoanNo] ? styles.activeTabBg : styles.inactiveTabBg
                            }`}
                          >
                            <input 
                              type="checkbox"
                              id={`collateral-loan-${loan.mwLoanNo}`}
                              checked={collateralLoanRelationships[selectedCollateralId]?.[loan.mwLoanNo] || false}
                              onChange={() => toggleCollateralLoanRelationship(loan.mwLoanNo)}
                              className="mr-2"
                            />
                            <label 
                              htmlFor={`collateral-loan-${loan.mwLoanNo}`}
                              className="flex-1 cursor-pointer flex items-center justify-between"
                            >
                              <div className={`font-medium ${styles.textPrimary} text-xs`}>
                                #{loan.mwLoanNo}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className={`${styles.textGreen} font-medium text-xs`}>
                                  ${loan.principal.toLocaleString()}
                                </span>
                                <span className={`${styles.textMuted} text-xs`}>
                                  @ {loan.intRate}%
                                </span>
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                      
                      {/* Summary */}
                      <div className={`mt-4 pt-3 ${styles.borderColor} border-t`}>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs ${styles.textMuted}`}>Securing Loans:</span>
                          <span className={`text-xs font-medium ${styles.textPrimary}`}>
                            {Object.values(collateralLoanRelationships[selectedCollateralId] || {}).filter(Boolean).length} of {getSortedLoans().length}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className={`text-xs ${styles.textMuted}`}>Total Secured:</span>
                          <span className={`text-xs font-medium ${styles.textGreen}`}>
                            ${getSortedLoans()
                              .filter(loan => collateralLoanRelationships[selectedCollateralId]?.[loan.mwLoanNo])
                              .reduce((sum, loan) => sum + loan.principal, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* SQL Connection Info */}
                    <div className={`${styles.alertBg} ${styles.alertBorder} rounded-lg border p-3`}>
                      <div className="flex items-start">
                        <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
                        <div className={`text-xs ${styles.alertText}`}>
                          <p className="font-medium">SQL Connection Points:</p>
                          <p className="mt-1">• SELECT * FROM collateral WHERE loan_id = '{selectedLoan}'</p>
                          <p>• INSERT INTO collateral (loan_id, ...) VALUES (...)</p>
                          <p>• UPDATE collateral SET field = value WHERE id = {selectedCollateralId}</p>
                          <p>• DELETE FROM collateral WHERE id = collateral_id</p>
                          <p className="mt-2">Relationships:</p>
                          <p>• SELECT * FROM collateral_loan_relationships WHERE collateral_id = {selectedCollateralId}</p>
                          <p>• INSERT INTO collateral_loan_relationships (collateral_id, loan_id) VALUES (...)</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Delete Confirmation Modal */}
              {deleteCollateralConfirmation.show && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className={`${styles.sectionBg} rounded-lg p-6 max-w-md w-full mx-4 ${styles.borderColor} border`}>
                    <h3 className={`text-lg font-medium ${styles.textPrimary} mb-4`}>Confirm Delete</h3>
                    <p className={`${styles.textSecondary} mb-6`}>
                      Are you sure you want to delete <span className="font-medium">{deleteCollateralConfirmation.collateralDescription || '(New)'}</span>?
                      <br />
                      <span className="text-xs mt-2 block">This action cannot be undone.</span>
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={cancelCollateralDelete}
                        className={`px-4 py-2 ${styles.cardBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-sm ${styles.buttonHover}`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmCollateralDelete}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Comment Tab Content - Comment management */}
          {activeTab === 'Comment' && (
            <div className="p-4">
              <div className="flex space-x-4">
                {/* Left Panel - Comments Table */}
                <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`} style={{ width: '500px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-medium ${styles.textPrimary}`}>Comments</h3>
                    <button
                      onClick={addNewComment}
                      className={`px-3 py-1.5 ${styles.cardBg} ${styles.inputBorder} border ${styles.textGreen} rounded transition-colors text-xs font-medium ${styles.buttonHover}`}
                    >
                      + Add Comment
                    </button>
                  </div>
                  
                  {/* Comments Table */}
                  <div className={`${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded border ${styles.borderColor} overflow-auto`} style={{ maxHeight: '600px' }}>
                    <table className="w-full">
                      <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                        <tr className={`${styles.borderColor} border-b`}>
                          <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Loan #</th>
                          <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Type</th>
                          <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Date</th>
                          <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Preview</th>
                          <th className={`px-2 py-2`} style={{ width: '30px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {commentsList.map(comment => (
                          <tr
                            key={comment.id}
                            onClick={() => setSelectedCommentId(comment.id)}
                            className={`${styles.borderColor} border-b cursor-pointer transition-colors ${
                              comment.id === selectedCommentId
                                ? theme === 'dark' ? 'bg-zinc-800' : 'bg-blue-50'
                                : styles.hoverBg
                            }`}
                          >
                            <td className={`px-3 py-2 text-xs ${styles.textPrimary} font-medium`}>{comment.loanNo}</td>
                            <td className={`px-3 py-2 text-xs ${styles.textPrimary}`}>{comment.commentType}</td>
                            <td className={`px-3 py-2 text-xs ${styles.textSecondary}`}>{comment.date}</td>
                            <td className={`px-3 py-2 text-xs ${styles.textSecondary}`}>{getCommentPreview(comment.text)}</td>
                            <td className="px-2 py-2">
                              {commentsList.length > 1 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteComment(comment.id);
                                  }}
                                  className={`${styles.textMuted} hover:text-red-500 text-xs`}
                                  title="Delete comment"
                                >
                                  ×
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className={`mt-3 text-xs ${styles.textMuted}`}>
                    <p>• Click a comment to view/edit</p>
                    <p>• Click + Add Comment to create new</p>
                    <p>• Click × to delete a comment</p>
                  </div>
                </div>
                
                {/* Right Panel - Comment Detail */}
                {selectedComment && (
                  <div className={`flex-1 ${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
                    <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Comment Details</h3>
                    
                    <div className="space-y-4">
                      {/* Loan Number and Type */}
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Loan Number:</label>
                          <select
                            value={selectedComment.loanNo}
                            onChange={(e) => handleCommentFieldChange('loanNo', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                          >
                            {loans.map(loan => (
                              <option key={loan.mwLoanNo} value={loan.mwLoanNo}>
                                {loan.mwLoanNo}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Comment Type:</label>
                          <select
                            value={selectedComment.commentType}
                            onChange={(e) => handleCommentFieldChange('commentType', e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          >
                            {commentTypes.map(type => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Date:</label>
                          <input
                            type="text"
                            value={selectedComment.date}
                            onChange={(e) => handleCommentFieldChange('date', e.target.value)}
                            placeholder="MM/DD/YY"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                      </div>
                      
                      {/* Comment Text */}
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Comment Text:</label>
                        <textarea
                          value={selectedComment.text}
                          onChange={(e) => handleCommentFieldChange('text', e.target.value)}
                          placeholder="Enter comment text here. Can be as long as needed - perfect for note history, detailed underwriting notes, legal documentation, etc."
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder} font-mono`}
                          style={{ minHeight: '400px', resize: 'vertical' }}
                        />
                        <p className={`text-xs ${styles.textMuted} mt-1`}>
                          {selectedComment.text.length} characters
                        </p>
                      </div>
                    </div>
                    
                    {/* SQL Connection Info */}
                    <div className={`mt-4 ${styles.alertBg} ${styles.alertBorder} rounded-lg border p-3`}>
                      <div className="flex items-start">
                        <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
                        <div className={`text-xs ${styles.alertText}`}>
                          <p className="font-medium">SQL Connection Points:</p>
                          <p className="mt-1">• SELECT * FROM comments WHERE loan_id = '{selectedLoan}'</p>
                          <p>• INSERT INTO comments (loan_id, comment_type, date, text) VALUES (...)</p>
                          <p>• UPDATE comments SET field = value WHERE id = {selectedCommentId}</p>
                          <p>• DELETE FROM comments WHERE id = comment_id</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PayHist Tab Content - Shows payment history in a year/month grid */}
          {activeTab === 'PayHist' && selectedLoanData && (
            <div className="p-4">
              {/* Loan Header Info */}
              <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Loan #:</span>
                      <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoan}</span>
                    </div>
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Borrower:</span>
                      <span className={`ml-2 ${styles.textPrimary}`}>{selectedLoanData.borrowerName}</span>
                    </div>
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Current Balance:</span>
                      <span className={`ml-2 font-medium ${styles.textGreen}`}>${selectedLoanData.principal.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Monthly Payment:</span>
                      <span className={`ml-2 ${styles.textPrimary}`}>${selectedLoanData.pmt.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Rate:</span>
                      <span className={`ml-2 ${styles.textPrimary}`}>{selectedLoanData.intRate}%</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={exportPaymentHistory}
                      className={`px-4 py-1.5 ${styles.cardBg} ${styles.inputBorder} border ${styles.textPrimary} rounded transition-colors text-xs ${styles.buttonHover}`}
                    >
                      Export History
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                {/* Left Panel - Editable Data Table (Excel-like) */}
                <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`} style={{ minWidth: '350px' }}>
                  <h3 className={`font-medium mb-3 ${styles.textPrimary} text-center`}>Payment Entry for Loan #{selectedLoan}</h3>
                  
                  {/* Excel-like Editable Table */}
                  <div className={`${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded border ${styles.borderColor}`}>
                    <table className="w-full">
                      <thead>
                        <tr className={`${styles.borderColor} border-b ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                          <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '80px' }}>Year</th>
                          <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '80px' }}>Month</th>
                          <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`} style={{ width: '100px' }}>Amount</th>
                          <th className={`px-2 py-2`} style={{ width: '30px' }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {getFilteredPaymentRecords().map((record, index) => (
                          <tr key={record.id} className={`${styles.borderColor} border-b ${styles.hoverBg}`}>
                            <td className="px-0 py-0">
                              <input
                                id={`year-${record.id}`}
                                type="text"
                                value={record.year}
                                onChange={(e) => handleCellEdit(record.id, 'year', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, record.id, 'year')}
                                placeholder="YYYY"
                                maxLength="4"
                                className={`w-full px-3 py-2 text-xs ${styles.textPrimary} bg-transparent focus:outline-none focus:ring-1 focus:ring-green-500`}
                                style={{ border: 'none' }}
                              />
                            </td>
                            <td className="px-0 py-0">
                              <input
                                id={`month-${record.id}`}
                                type="text"
                                value={record.month}
                                onChange={(e) => handleCellEdit(record.id, 'month', e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, record.id, 'month')}
                                placeholder="1-12"
                                maxLength="2"
                                className={`w-full px-3 py-2 text-xs ${styles.textPrimary} bg-transparent focus:outline-none focus:ring-1 focus:ring-green-500`}
                                style={{ border: 'none' }}
                              />
                            </td>
                            <td className="px-0 py-0">
                              <input
                                id={`amount-${record.id}`}
                                type="text"
                                value={record.amount}
                                onChange={(e) => handleCellEdit(record.id, 'amount', e.target.value)}
                                onBlur={(e) => handleAmountBlur(record.id, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, record.id, 'amount')}
                                placeholder="0.00"
                                title="You can enter calculations like 500+108.15 or 608.15*2"
                                className={`w-full px-3 py-2 text-xs ${styles.textGreen} bg-transparent focus:outline-none focus:ring-1 focus:ring-green-500`}
                                style={{ border: 'none' }}
                              />
                            </td>
                            <td className="px-2 py-0">
                              {record.year && record.month && record.amount && index < getFilteredPaymentRecords().length - 1 && (
                                <button
                                  onClick={() => deletePaymentRow(record.id)}
                                  className={`${styles.textMuted} hover:text-red-500 text-xs`}
                                  title="Delete row"
                                >
                                  ×
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className={`mt-3 text-xs ${styles.textMuted}`}>
                    <p>• Click any cell to edit</p>
                    <p>• Press Enter or ↓ to move down</p>
                    <p>• Press Tab to move right</p>
                    <p>• New row appears automatically</p>
                    <p>• Amount field supports calculations: 500+108.15, 1000-392, 608.15*3, 1500/2</p>
                  </div>
                </div>
                
                {/* Right Panel - Payment History Grid */}
                <div className={`flex-1 ${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border overflow-x-auto`}>
                  <h3 className={`font-medium mb-3 ${styles.textPrimary} text-center`}>Data will be displayed here</h3>
                  
                  {/* Payment History Grid */}
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className={`text-left px-2 py-1 ${styles.textMuted} font-medium`}></th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>January</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>February</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>March</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>April</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>May</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>June</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>July</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>August</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>September</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>October</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>November</th>
                        <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>December</th>
                        <th className={`text-center px-2 py-1 ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Sum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Dynamically render years from payment grid data - only show years with payments */}
                      {Object.keys(paymentGridData)
                        .filter(year => {
                          const yearData = paymentGridData[year] || {};
                          const yearSum = calculateYearSum(yearData);
                          return yearSum > 0; // Only show years with actual payments
                        })
                        .sort((a, b) => a - b) // Sort years in ascending order
                        .map((year, index) => {
                          const yearData = paymentGridData[year] || {};
                          const yearSum = calculateYearSum(yearData);
                          return (
                            <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                              <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                const amount = yearData[month];
                                return (
                                  <td key={month} className={`text-center px-1 py-2 ${amount ? styles.textGreen : styles.textSecondary}`}>
                                    {amount ? amount.toFixed(2) : '-'}
                                  </td>
                                );
                              })}
                              <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? styles.textPrimary : styles.textSecondary} ${styles.borderColor} border-l`}>
                                ${yearSum.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      }
                      
                      {/* Total Row */}
                      <tr className={`${styles.borderColor} border-t font-medium`}>
                        <td className={`px-2 py-2 ${styles.textPrimary}`}>TOTAL</td>
                        <td colSpan="12" className={`text-right px-2 py-2 ${styles.textPrimary}`}>Grand Total:</td>
                        <td className={`text-center px-2 py-2 ${styles.textGreen} ${styles.borderColor} border-l`}>
                          ${Object.values(paymentGridData)
                            .reduce((total, yearData) => total + calculateYearSum(yearData), 0)
                            .toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  {/* Legend or Instructions */}
                  <div className={`mt-4 text-xs ${styles.textMuted}`}>
                    <p>• Payments are displayed by month and year</p>
                    <p>• "-" indicates no payment recorded for that month</p>
                    <p>• Sum column shows total payments for each year</p>
                    <p>• Data updates automatically as you type</p>
                  </div>
                  
                  {/* SQL Connection Info */}
                  <div className={`mt-4 p-3 ${styles.alertBg} ${styles.alertBorder} rounded-lg border`}>
                    <div className="flex items-start">
                      <AlertCircle size={16} className={`${styles.alertText} mr-2 mt-0.5`} />
                      <div className={`text-xs ${styles.alertText}`}>
                        <p className="font-medium">SQL Connection Points:</p>
                        <p className="mt-1">• SELECT * FROM payment_history WHERE loan_id = '{selectedLoan}' ORDER BY year DESC, month DESC</p>
                        <p>• INSERT INTO payment_history (loan_id, year, month, amount) VALUES ('{selectedLoan}', year, month, amount)</p>
                        <p>• UPDATE payment_history SET amount = value WHERE id = record_id</p>
                        <p>• DELETE FROM payment_history WHERE id = record_id</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Trailing Payment Analytics - Compact */}
                  {(() => {
                    const lastImportDate = selectedLoanData?.lastImportDate;
                    
                    if (!lastImportDate) {
                      return (
                        <div className={`mt-3 p-2 ${styles.inputBg} ${styles.inputBorder} rounded border`}>
                          <div className={`text-xs ${styles.textMuted} text-center`}>
                            Set Last Import Date in Loan tab for analytics
                          </div>
                        </div>
                      );
                    }
                    
                    const trailing12 = calculateTrailingPayments(selectedLoan, 12, lastImportDate);
                    const trailing6 = calculateTrailingPayments(selectedLoan, 6, lastImportDate);
                    const trailing3 = calculateTrailingPayments(selectedLoan, 3, lastImportDate);
                    
                    return (
                      <div className="mt-3">
                        {/* Table Layout with Row Labels */}
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5`}></th>
                              <th className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textPrimary}`}>T12</th>
                              <th className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textPrimary}`}>T6</th>
                              <th className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textPrimary}`}>T3</th>
                            </tr>
                          </thead>
                          <tbody>
                            {trailing12 && trailing6 && trailing3 && (
                              <>
                                {/* $/Mo Row */}
                                <tr>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 ${styles.textMuted} font-medium`}>$/Mo</td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${trailing12.monthly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${trailing6.monthly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${trailing3.monthly.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                </tr>
                                
                                {/* $/Yr Row */}
                                <tr>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 ${styles.textMuted} font-medium`}>$/Yr</td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${trailing12.actual.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${(trailing6.actual * 2).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${(trailing3.actual * 4).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                </tr>
                                
                                {/* Actual Row */}
                                <tr>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 ${styles.textMuted} font-medium`}>Actual</td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${trailing12.actual.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${trailing6.actual.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    ${trailing3.actual.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                  </td>
                                </tr>
                                
                                {/* % Cont. Row */}
                                <tr>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 ${styles.textMuted} font-medium`}>% Cont.</td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${
                                    trailing12.percentOfContractual >= 100 ? styles.textGreen :
                                    trailing12.percentOfContractual >= 80 ? styles.textYellow :
                                    'text-red-500'
                                  }`}>
                                    {trailing12.percentOfContractual.toFixed(1)}%
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${
                                    trailing6.percentOfContractual >= 100 ? styles.textGreen :
                                    trailing6.percentOfContractual >= 80 ? styles.textYellow :
                                    'text-red-500'
                                  }`}>
                                    {trailing6.percentOfContractual.toFixed(1)}%
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${
                                    trailing3.percentOfContractual >= 100 ? styles.textGreen :
                                    trailing3.percentOfContractual >= 80 ? styles.textYellow :
                                    'text-red-500'
                                  }`}>
                                    {trailing3.percentOfContractual.toFixed(1)}%
                                  </td>
                                </tr>
                                
                                {/* % Int. Row */}
                                <tr>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 ${styles.textMuted} font-medium`}>% Int.</td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing12.percentOfInterestOnly.toFixed(1)}%
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing6.percentOfInterestOnly.toFixed(1)}%
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing3.percentOfInterestOnly.toFixed(1)}%
                                  </td>
                                </tr>
                                
                                {/* Mo Pd (Cont.) Row */}
                                <tr>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 ${styles.textMuted} font-medium`}>Mo Pd (Cont.)</td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing12.monthsPaidContractual.toFixed(1)}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing6.monthsPaidContractual.toFixed(1)}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing3.monthsPaidContractual.toFixed(1)}
                                  </td>
                                </tr>
                                
                                {/* Mo Pd (Int.) Row */}
                                <tr>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 ${styles.textMuted} font-medium`}>Mo Pd (Int.)</td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing12.monthsPaidInterest.toFixed(1)}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing6.monthsPaidInterest.toFixed(1)}
                                  </td>
                                  <td className={`${styles.readOnlyBg} ${styles.inputBorder} border p-1.5 text-center font-medium ${styles.textYellow}`}>
                                    {trailing3.monthsPaidInterest.toFixed(1)}
                                  </td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Projections Tab Content - Cash flow projections */}
          {activeTab === 'Projections' && selectedLoanData && (
            <div className="p-4">
              {/* Loan Header Info */}
              <div className={`${styles.cardBg} rounded-lg p-3 ${styles.inputBorder} border mb-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Loan #:</span>
                      <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoan}</span>
                    </div>
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Borrower:</span>
                      <span className={`ml-2 ${styles.textPrimary}`}>{selectedLoanData.borrowerName}</span>
                    </div>
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>UPB:</span>
                      <span className={`ml-2 font-medium ${styles.textGreen}`}>${selectedLoanData.principal.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Contractual Rate:</span>
                      <span className={`ml-2 font-medium ${styles.textPrimary}`}>{selectedLoanData.intRate}%</span>
                    </div>
                    <div>
                      <span className={`text-xs ${styles.textMuted}`}>Contractual Pmt:</span>
                      <span className={`ml-2 font-medium ${styles.textPrimary}`}>${selectedLoanData.pmt.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projection Settings */}
              <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
                <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Projection Settings</h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {/* Payment Method Section */}
                  <div>
                    <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Payment Method</h4>
                    
                    {/* Payment Method Dropdown */}
                    <div className="mb-3">
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Payment Type:</label>
                      <select
                        value={projectionPaymentMethod}
                        onChange={(e) => setProjectionPaymentMethod(e.target.value)}
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      >
                        {paymentMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                      {/* Calculated Payment Value Display */}
                      <div className={`mt-2 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
                        <span className={`text-xs ${styles.textMuted}`}>Calculated: </span>
                        <span className={`text-sm font-medium ${styles.textYellow}`}>
                          ${calculateProjectedPayment().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/mo
                        </span>
                      </div>
                    </div>

                    {/* Conditional inputs based on payment method */}
                    {projectionPaymentMethod === 'User Enter' && (
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Payment Amount:</label>
                        <input
                          type="text"
                          value={projectionUserPayment}
                          onChange={(e) => setProjectionUserPayment(e.target.value)}
                          placeholder="0.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                    )}
                    
                    {projectionPaymentMethod === 'Term Pmt' && (
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Amortization (months):</label>
                        <input
                          type="text"
                          value={projectionAmortMonths}
                          onChange={(e) => setProjectionAmortMonths(e.target.value)}
                          placeholder="360"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                        <p className={`text-xs ${styles.textMuted} mt-1`}>
                          {(parseInt(projectionAmortMonths) / 12).toFixed(1)} years
                        </p>
                      </div>
                    )}
                    
                    {projectionPaymentMethod === '% of Trail Pmt' && (
                      <div className="space-y-3">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Trailing Period:</label>
                          <select
                            value={projectionTrailPeriod}
                            onChange={(e) => setProjectionTrailPeriod(e.target.value)}
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          >
                            <option value="12">12 Months</option>
                            <option value="6">6 Months</option>
                            <option value="3">3 Months</option>
                          </select>
                        </div>
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Percentage (%):</label>
                          <input
                            type="text"
                            value={projectionTrailPercentage}
                            onChange={(e) => setProjectionTrailPercentage(e.target.value)}
                            placeholder="100"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} ${parseFloat(projectionTrailPercentage) < 0 || parseFloat(projectionTrailPercentage) > 100 ? 'border-yellow-500' : ''}`}
                          />
                          {(parseFloat(projectionTrailPercentage) < 0 || parseFloat(projectionTrailPercentage) > 100) && (
                            <p className="text-xs text-yellow-400 mt-1">⚠️ Percentage should be 0-100</p>
                          )}
                        </div>
                        {/* No Payment History Warning */}
                        {(() => {
                          const trailingData = calculateTrailingPayments(
                            selectedLoan,
                            parseInt(projectionTrailPeriod),
                            selectedLoanData?.lastImportDate
                          );
                          return trailingData && trailingData.paymentsReceived === 0 ? (
                            <div className="p-2 bg-yellow-900/30 border border-yellow-500/50 rounded">
                              <div className="flex items-center gap-2">
                                <span className="text-yellow-400">⚠️</span>
                                <span className="text-yellow-300 text-xs">
                                  No payment history available for trailing calculation. Using $0.
                                </span>
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                  
                  {/* Rate Method Section */}
                  <div>
                    <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Rate Method</h4>

                    {/* Rate Method Dropdown */}
                    <div className="mb-3">
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Rate Type:</label>
                      <select
                        value={projectionRateMethod}
                        onChange={(e) => setProjectionRateMethod(e.target.value)}
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      >
                        {rateMethods.map(method => (
                          <option key={method} value={method}>{method}</option>
                        ))}
                      </select>
                      {/* Effective Rate Value Display */}
                      <div className={`mt-2 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
                        <span className={`text-xs ${styles.textMuted}`}>Effective Rate: </span>
                        <span className={`text-sm font-medium ${styles.textYellow}`}>
                          {getProjectedRate().toFixed(2)}%
                        </span>
                      </div>
                    </div>

                    {/* Conditional input for user-entered rate */}
                    {projectionRateMethod === 'User Enter' && (
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Interest Rate (%):</label>
                        <input
                          type="text"
                          value={projectionUserRate}
                          onChange={(e) => setProjectionUserRate(e.target.value)}
                          placeholder="0.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                    )}
                    
                    {/* Show note about rate usage */}
                    {(projectionPaymentMethod === 'Term Pmt' || projectionPaymentMethod === 'Interest Payment') && (
                      <div className={`mt-3 p-2 ${styles.alertBg} ${styles.alertBorder} rounded border`}>
                        <p className={`text-xs ${styles.alertText}`}>
                          Rate affects {projectionPaymentMethod} calculation
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Expense Assumptions */}
                <div className={`mt-6 pt-4 border-t ${styles.borderColor}`}>
                  <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Expense Assumptions</h4>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* Initial Legal */}
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Initial Legal ($):</label>
                      <input
                        type="text"
                        value={projectionInitialLegal}
                        onChange={(e) => setProjectionInitialLegal(e.target.value)}
                        placeholder="0.00"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                    
                    {/* Initial Legal Start Month */}
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Initial Legal Start Month:</label>
                      <input
                        type="text"
                        value={projectionInitialLegalStartMonth}
                        onChange={(e) => setProjectionInitialLegalStartMonth(e.target.value)}
                        placeholder="1"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                    
                    {/* Holding Costs */}
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Holding Costs ($/month):</label>
                      <input
                        type="text"
                        value={projectionHoldingCosts}
                        onChange={(e) => setProjectionHoldingCosts(e.target.value)}
                        placeholder="0.00"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                    </div>
                    
                    {/* Holding Costs End Month */}
                    <div>
                      <label className={`text-xs ${styles.textMuted} block mb-1`}>Holding Costs Through Month:</label>
                      <input
                        type="text"
                        value={projectionHoldingCostsEndMonth}
                        onChange={(e) => setProjectionHoldingCostsEndMonth(e.target.value)}
                        placeholder="12"
                        className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                      />
                      <p className={`text-xs ${styles.textMuted} mt-1`}>
                        {(() => {
                          const legalStartMonth = parseInt(projectionInitialLegalStartMonth) || 0;
                          const holdingEndMonth = parseInt(projectionHoldingCostsEndMonth) || 0;
                          const numberOfMonths = Math.max(0, holdingEndMonth - legalStartMonth);
                          return `${numberOfMonths} months × $${parseFloat(projectionHoldingCosts || 0).toLocaleString()} = $${calculateTotalHoldingCosts().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Add Back to Exit */}
                  <div className="mt-4 pt-4 border-t border-dashed" style={{ borderColor: 'inherit' }}>
                    <h5 className={`text-xs font-medium ${styles.textPrimary} mb-3`}>Add Back to Exit</h5>
                    
                    <div className="grid grid-cols-2 gap-6">
                      {/* Add Back Percentage */}
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Recovery Percentage (%):</label>
                        <input
                          type="text"
                          value={projectionAddBackPercentage}
                          onChange={(e) => setProjectionAddBackPercentage(e.target.value)}
                          placeholder="0"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} ${parseFloat(projectionAddBackPercentage) < 0 || parseFloat(projectionAddBackPercentage) > 100 ? 'border-yellow-500' : ''}`}
                        />
                        {(parseFloat(projectionAddBackPercentage) < 0 || parseFloat(projectionAddBackPercentage) > 100) && (
                          <p className="text-xs text-yellow-400 mt-1">⚠️ Percentage should be 0-100</p>
                        )}
                      </div>
                      
                      {/* Add Back Basis */}
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Apply To:</label>
                        <select
                          value={projectionAddBackBasis}
                          onChange={(e) => setProjectionAddBackBasis(e.target.value)}
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        >
                          <option value="Initial Only">Initial Legal Only</option>
                          <option value="Initial + Holding">Initial Legal + Holding Costs</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Show calculation */}
                    <div className={`mt-3 ${styles.readOnlyBg} rounded p-2 ${styles.inputBorder} border`}>
                      <div className={`text-xs ${styles.textMuted}`}>Expected Recovery at Exit:</div>
                      <div className={`text-sm font-medium ${styles.textYellow} mt-1`}>
                        ${calculateAddBackToExit().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                      <div className={`text-xs ${styles.textMuted} mt-1`}>
                        {projectionAddBackPercentage}% of {projectionAddBackBasis === 'Initial Only' 
                          ? `Initial Legal ($${parseFloat(projectionInitialLegal || 0).toLocaleString()})`
                          : `Initial + Holding ($${(parseFloat(projectionInitialLegal || 0) + calculateTotalHoldingCosts()).toLocaleString()})`
                        }
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Calculated Results */}
                <div className={`mt-6 pt-4 border-t ${styles.borderColor}`}>
                  <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Projected Cash Flow</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                      <div className={`text-xs ${styles.textMuted} mb-1`}>Monthly Payment</div>
                      <div className={`text-lg font-medium ${styles.textYellow}`}>
                        ${calculateProjectedPayment().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                    
                    <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                      <div className={`text-xs ${styles.textMuted} mb-1`}>Effective Rate</div>
                      <div className={`text-lg font-medium ${styles.textYellow}`}>
                        {getProjectedRate().toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                      <div className={`text-xs ${styles.textMuted} mb-1`}>Annual Cash Flow</div>
                      <div className={`text-lg font-medium ${styles.textYellow}`}>
                        ${(calculateProjectedPayment() * 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Exit Scenario Settings */}
              <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border mt-4`}>
                <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Exit Scenario Settings</h3>
                
                {/* Cash Flow Timing */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Cash Flow Start Month:</label>
                    <input
                      type="text"
                      value={exitStartMonth}
                      onChange={(e) => setExitStartMonth(e.target.value)}
                      placeholder="1"
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} ${parseInt(exitStartMonth) > parseInt(exitEndMonth) ? 'border-yellow-500' : ''}`}
                    />
                    {parseInt(exitStartMonth) < 1 && (
                      <p className="text-xs text-yellow-400 mt-1">⚠️ Start month must be at least 1</p>
                    )}
                  </div>

                  <div>
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Month:</label>
                    <input
                      type="text"
                      value={exitEndMonth}
                      onChange={(e) => setExitEndMonth(e.target.value)}
                      placeholder="24"
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} ${parseInt(exitEndMonth) > 60 ? 'border-red-500' : ''}`}
                    />
                    <p className={`text-xs ${styles.textMuted} mt-1`}>
                      {parseInt(exitEndMonth) - parseInt(exitStartMonth) + 1} months of cash flow
                    </p>
                    {parseInt(exitEndMonth) > 60 && (
                      <p className="text-xs text-red-400 mt-1">⚠️ Maximum projection is 60 months</p>
                    )}
                    {parseInt(exitStartMonth) > parseInt(exitEndMonth) && (
                      <p className="text-xs text-yellow-400 mt-1">⚠️ Exit month must be ≥ start month</p>
                    )}
                  </div>
                </div>
                
                <div className={`pt-4 border-t ${styles.borderColor}`}>
                  <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Exit Method</h4>
                  
                  {/* Exit Method Dropdown */}
                  <div className="mb-4">
                    <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Type:</label>
                    <select
                      value={exitMethod}
                      onChange={(e) => setExitMethod(e.target.value)}
                      className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                    >
                      {exitMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                    {/* Calculated Exit Value Display */}
                    <div className={`mt-2 px-2 py-1 ${styles.readOnlyBg} rounded ${styles.inputBorder} border`}>
                      <span className={`text-xs ${styles.textMuted}`}>Exit Value: </span>
                      <span className={`text-sm font-medium ${getCalculatedExitValue() < 0 ? 'text-red-500' : styles.textYellow}`}>
                        ${getCalculatedExitValue().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </span>
                      {getCalculatedExitValue() < 0 && (
                        <span className="text-red-400 text-xs ml-2">⚠️</span>
                      )}
                    </div>
                  </div>

                  {/* Conditional inputs based on exit method */}
                  <div className="space-y-4">
                    {exitMethod === 'Pay in Full' && (
                      <div className={`p-3 ${styles.alertBg} ${styles.alertBorder} rounded border`}>
                        <p className={`text-xs ${styles.alertText}`}>
                          Calculates future value using projected payment and rate over the period. Includes one additional payment for final month.
                        </p>
                      </div>
                    )}
                    
                    {exitMethod === 'DPO' && (
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>DPO Percentage (% of Pay in Full):</label>
                        <input
                          type="text"
                          value={exitDpoPercentage}
                          onChange={(e) => setExitDpoPercentage(e.target.value)}
                          placeholder="95"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} ${parseFloat(exitDpoPercentage) < 0 || parseFloat(exitDpoPercentage) > 100 ? 'border-yellow-500' : ''}`}
                        />
                        <p className={`text-xs ${styles.textMuted} mt-1`}>
                          PIF Amount: ${calculatePayInFull().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                        {(parseFloat(exitDpoPercentage) < 0 || parseFloat(exitDpoPercentage) > 100) && (
                          <p className="text-xs text-yellow-400 mt-1">⚠️ Percentage should be 0-100</p>
                        )}
                      </div>
                    )}

                    {exitMethod === 'Value Cap' && (
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Value Cap Percentage (% of Collateral Value):</label>
                        <input
                          type="text"
                          value={exitValueCapPercentage}
                          onChange={(e) => setExitValueCapPercentage(e.target.value)}
                          placeholder="90"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder} ${parseFloat(exitValueCapPercentage) < 0 || parseFloat(exitValueCapPercentage) > 100 ? 'border-yellow-500' : ''}`}
                        />
                        <p className={`text-xs ${styles.textMuted} mt-1`}>
                          {(() => {
                            const loanCollateral = collateralData.find(c =>
                              collateralLoanRelationships[c.id]?.[selectedLoan]
                            );
                            const collateralValue = loanCollateral ? parseFloat(String(loanCollateral.ourValue).replace(/[$,]/g, '')) : 0;
                            return `Collateral Value: $${collateralValue.toLocaleString()}`;
                          })()}
                        </p>
                        {(parseFloat(exitValueCapPercentage) < 0 || parseFloat(exitValueCapPercentage) > 100) && (
                          <p className="text-xs text-yellow-400 mt-1">⚠️ Percentage should be 0-100</p>
                        )}
                      </div>
                    )}
                    
                    {exitMethod === 'User Enter' && (
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Exit Value ($):</label>
                        <input
                          type="text"
                          value={exitUserEnterAmount}
                          onChange={(e) => setExitUserEnterAmount(e.target.value)}
                          placeholder="0.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                      </div>
                    )}
                    
                    {exitMethod === 'YTM Sell Solve' && (
                      <div>
                        <label className={`text-xs ${styles.textMuted} block mb-1`}>Desired YTM (%):</label>
                        <input
                          type="text"
                          value={exitYtmDesired}
                          onChange={(e) => setExitYtmDesired(e.target.value)}
                          placeholder="12.00"
                          className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                        />
                        <p className={`text-xs ${styles.textMuted} mt-1`}>
                          Solves for sale price that achieves this yield with projected payments
                        </p>
                      </div>
                    )}
                    
                    {exitMethod === 'Liquidation' && (
                      <div className="space-y-3">
                        <div>
                          <label className={`text-xs ${styles.textMuted} block mb-1`}>Liquidation Months (no payments):</label>
                          <input
                            type="text"
                            value={exitLiquidationMonths}
                            onChange={(e) => setExitLiquidationMonths(e.target.value)}
                            placeholder="12"
                            className={`${styles.inputBg} ${styles.inputBorder} border rounded px-3 py-2 w-full text-sm ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                          />
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="addCurrentInterest"
                            checked={exitLiquidationAddInterest}
                            onChange={(e) => setExitLiquidationAddInterest(e.target.checked)}
                            className="mr-2"
                          />
                          <label htmlFor="addCurrentInterest" className={`text-xs ${styles.textPrimary}`}>
                            Add current interest to balance (${selectedLoanData.interest.toLocaleString()})
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Calculated Exit Value */}
                <div className={`mt-6 pt-4 border-t ${styles.borderColor}`}>
                  <h4 className={`text-sm font-medium ${styles.textPrimary} mb-3`}>Exit Value Summary</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                      <div className={`text-xs ${styles.textMuted} mb-1`}>Exit Value</div>
                      <div className={`text-lg font-medium ${getCalculatedExitValue() < 0 ? 'text-red-500' : styles.textYellow}`}>
                        ${getCalculatedExitValue().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                    
                    <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                      <div className={`text-xs ${styles.textMuted} mb-1`}>Add Back Recovery</div>
                      <div className={`text-lg font-medium ${styles.textYellow}`}>
                        ${calculateAddBackToExit().toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                    
                    <div className={`${styles.readOnlyBg} rounded p-3 ${styles.inputBorder} border`}>
                      <div className={`text-xs ${styles.textMuted} mb-1`}>Total Exit Proceeds</div>
                      <div className={`text-lg font-medium ${getCalculatedExitValue() + calculateAddBackToExit() < 0 ? 'text-red-500' : styles.textGreen}`}>
                        ${(getCalculatedExitValue() + calculateAddBackToExit()).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>

                  {/* Negative Exit Value Warning */}
                  {getCalculatedExitValue() < 0 && (
                    <div className="mt-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <span className="text-red-400 text-lg">⚠️</span>
                        <div>
                          <div className="text-red-400 font-medium text-sm">Warning: Exit value is negative</div>
                          <div className="text-red-300/70 text-xs mt-1">
                            This may indicate the loan balance exceeds the expected recovery value.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Projection Tables */}
              <div className="mt-4 space-y-4">
                {(() => {
                  const projectionGrid = buildProjectionGrid();
                  
                  return (
                    <>
                      {/* Income Table */}
                      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
                        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Projected Income</h3>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                <th className={`text-left px-2 py-1 ${styles.textMuted} font-medium`}></th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jan</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Feb</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Mar</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Apr</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>May</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jun</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jul</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Aug</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Sep</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Oct</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Nov</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Dec</th>
                                <th className={`text-center px-2 py-1 ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Sum</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(projectionGrid.income).map((year, index) => {
                                const yearData = projectionGrid.income[year] || {};
                                const yearSum = calculateProjectionYearSum(yearData);
                                
                                // Skip years with no data
                                if (yearSum === 0) return null;
                                
                                return (
                                  <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                                    <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                      const amount = yearData[month];
                                      return (
                                        <td key={month} className={`text-center px-1 py-2 ${amount > 0 ? styles.textGreen : styles.textSecondary}`}>
                                          {amount > 0 ? amount.toFixed(0) : '-'}
                                        </td>
                                      );
                                    })}
                                    <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? styles.textGreen : styles.textSecondary} ${styles.borderColor} border-l`}>
                                      ${yearSum.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Expenses Table */}
                      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
                        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Projected Expenses</h3>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                <th className={`text-left px-2 py-1 ${styles.textMuted} font-medium`}></th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jan</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Feb</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Mar</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Apr</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>May</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jun</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jul</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Aug</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Sep</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Oct</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Nov</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Dec</th>
                                <th className={`text-center px-2 py-1 ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Sum</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(projectionGrid.expenses).map((year, index) => {
                                const yearData = projectionGrid.expenses[year] || {};
                                const yearSum = calculateProjectionYearSum(yearData);
                                
                                // Skip years with no data
                                if (yearSum === 0) return null;
                                
                                return (
                                  <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                                    <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                      const amount = yearData[month];
                                      return (
                                        <td key={month} className={`text-center px-1 py-2 ${amount > 0 ? 'text-red-500' : styles.textSecondary}`}>
                                          {amount > 0 ? amount.toFixed(0) : '-'}
                                        </td>
                                      );
                                    })}
                                    <td className={`text-center px-2 py-2 font-medium ${yearSum > 0 ? 'text-red-500' : styles.textSecondary} ${styles.borderColor} border-l`}>
                                      ${yearSum.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      
                      {/* Net Cash Flow Table */}
                      <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
                        <h3 className={`font-medium mb-3 ${styles.textPrimary}`}>Net Cash Flow</h3>
                        
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr>
                                <th className={`text-left px-2 py-1 ${styles.textMuted} font-medium`}></th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jan</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Feb</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Mar</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Apr</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>May</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jun</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Jul</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Aug</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Sep</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Oct</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Nov</th>
                                <th className={`text-center px-1 py-1 ${styles.textMuted} font-medium`}>Dec</th>
                                <th className={`text-center px-2 py-1 ${styles.textMuted} font-medium ${styles.borderColor} border-l`}>Sum</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.keys(projectionGrid.netCashFlow).map((year, index) => {
                                const yearData = projectionGrid.netCashFlow[year] || {};
                                const yearSum = calculateProjectionYearSum(yearData);
                                
                                // Skip years with no data
                                if (yearSum === 0 && Object.values(yearData).every(v => v === 0)) return null;
                                
                                return (
                                  <tr key={year} className={index === 0 ? styles.borderColor + ' border-t' : ''}>
                                    <td className={`px-2 py-2 font-medium ${styles.textPrimary}`}>{year}</td>
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
                                      const amount = yearData[month];
                                      return (
                                        <td key={month} className={`text-center px-1 py-2 ${
                                          amount > 0 ? styles.textGreen : 
                                          amount < 0 ? 'text-red-500' : 
                                          styles.textSecondary
                                        }`}>
                                          {amount !== 0 ? amount.toFixed(0) : '-'}
                                        </td>
                                      );
                                    })}
                                    <td className={`text-center px-2 py-2 font-medium ${
                                      yearSum > 0 ? styles.textGreen : 
                                      yearSum < 0 ? 'text-red-500' : 
                                      styles.textSecondary
                                    } ${styles.borderColor} border-l`}>
                                      ${yearSum.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}

          {/* *** SQL CONNECTION POINTS FOR OTHER TABS ***
              Each tab would load different data:
              
              Collateral tab:
              SELECT * FROM collateral WHERE loan_id = {selectedLoan}
              
              Obligor tab:
              SELECT * FROM obligors WHERE loan_id = {selectedLoan}
              
              PayHist tab:
              SELECT * FROM payment_history WHERE loan_id = {selectedLoan} ORDER BY payment_date DESC
              
              FinStmts tab:
              SELECT * FROM financial_statements WHERE borrower_id = {borrower_id}
              
              Tasks tab:
              SELECT * FROM tasks WHERE loan_id = {selectedLoan} ORDER BY due_date
              
              Property tab:
              SELECT * FROM properties WHERE loan_id = {selectedLoan}
          */}
        </div>
      </div>
    </div>
  );
};

// Export the component so it can be imported and used in other files
export default AccessLayoutRobinhoodStyle;