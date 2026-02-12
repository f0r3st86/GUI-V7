// CommentTab component - displays comments for loans in the relationship
// Enhanced with: delete confirmation modal, date validation, search/filter,
// improved preview, sort, and comment type enforcement
import React from 'react';
import { AlertCircle, Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useTheme, useLoan } from '../../context';
import { COMMENT_TYPES } from '../../data';
import { getCommentPreview, getTodayFormatted } from '../../utils';
import { validateDateFormat } from '../../utils';
import { DeleteModal } from '../ui';
import {
  useLoans,
  useComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment
} from '../../hooks';
import type { Comment } from '../../types';

// Type badge colors for comment types
const TYPE_COLORS: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
  Note: { bg: 'bg-blue-100', text: 'text-blue-700', darkBg: 'bg-blue-900/30', darkText: 'text-blue-400' },
  Legal: { bg: 'bg-red-100', text: 'text-red-700', darkBg: 'bg-red-900/30', darkText: 'text-red-400' },
  Underwriting: { bg: 'bg-purple-100', text: 'text-purple-700', darkBg: 'bg-purple-900/30', darkText: 'text-purple-400' },
  Property: { bg: 'bg-green-100', text: 'text-green-700', darkBg: 'bg-green-900/30', darkText: 'text-green-400' },
  Servicing: { bg: 'bg-yellow-100', text: 'text-yellow-700', darkBg: 'bg-yellow-900/30', darkText: 'text-yellow-400' },
  Collection: { bg: 'bg-orange-100', text: 'text-orange-700', darkBg: 'bg-orange-900/30', darkText: 'text-orange-400' },
  Other: { bg: 'bg-gray-100', text: 'text-gray-700', darkBg: 'bg-gray-700/30', darkText: 'text-gray-400' },
};

type SortField = 'date' | 'type' | 'loanNo';
type SortDirection = 'asc' | 'desc';

interface DeleteConfirmState {
  show: boolean;
  commentId: number | null;
  commentPreview: string;
}

export const CommentTab = React.memo(() => {
  const { theme, styles } = useTheme();

  // UI state from Context
  const {
    selectedLoan,
    selectedCommentId,
    setSelectedCommentId
  } = useLoan();

  // Data from React Query
  const { data: loans, isLoading: loadingLoans } = useLoans();
  const { data: comments, isLoading: loadingComments } = useComments();
  const { mutate: addComment } = useAddComment();
  const { mutate: updateComment } = useUpdateComment();
  const { mutate: deleteComment } = useDeleteComment();

  // Local UI state
  const [searchText, setSearchText] = React.useState('');
  const [filterType, setFilterType] = React.useState<string>('All');
  const [filterLoan, setFilterLoan] = React.useState<string>('All');
  const [sortField, setSortField] = React.useState<SortField>('date');
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('desc');
  const [dateError, setDateError] = React.useState<string>('');
  const [deleteConfirm, setDeleteConfirm] = React.useState<DeleteConfirmState>({
    show: false,
    commentId: null,
    commentPreview: ''
  });

  // Computed values
  const commentsList = React.useMemo(
    () => comments || [],
    [comments]
  );

  // Parse date string (MM/DD/YY) to comparable value for sorting
  const parseDateForSort = React.useCallback((dateStr: string): number => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return 0;
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (isNaN(month) || isNaN(day) || isNaN(year)) return 0;
    // Convert 2-digit year: 00-49 = 2000s, 50-99 = 1900s
    const fullYear = year < 50 ? 2000 + year : 1900 + year;
    return fullYear * 10000 + month * 100 + day;
  }, []);

  // Filtered and sorted comments
  const filteredComments = React.useMemo(() => {
    let filtered = commentsList;

    // Filter by type
    if (filterType !== 'All') {
      filtered = filtered.filter(c => c.commentType === filterType);
    }

    // Filter by loan
    if (filterLoan !== 'All') {
      filtered = filtered.filter(c => c.loanNo === filterLoan);
    }

    // Filter by search text
    if (searchText.trim()) {
      const search = searchText.toLowerCase().trim();
      filtered = filtered.filter(c =>
        c.text.toLowerCase().includes(search) ||
        c.loanNo.toLowerCase().includes(search) ||
        c.commentType.toLowerCase().includes(search) ||
        c.date.toLowerCase().includes(search)
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = parseDateForSort(a.date) - parseDateForSort(b.date);
          break;
        case 'type':
          cmp = a.commentType.localeCompare(b.commentType);
          break;
        case 'loanNo':
          cmp = a.loanNo.localeCompare(b.loanNo);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [commentsList, filterType, filterLoan, searchText, sortField, sortDirection, parseDateForSort]);

  const selectedComment = React.useMemo(
    () => commentsList.find(c => c.id === selectedCommentId),
    [commentsList, selectedCommentId]
  );

  // Unique loan numbers for filter dropdown
  const loanNumbers = React.useMemo(() => {
    const nums = new Set(commentsList.map(c => c.loanNo));
    return Array.from(nums).sort();
  }, [commentsList]);

  const getNextCommentId = React.useCallback(() => {
    if (commentsList.length === 0) return 1;
    return Math.max(...commentsList.map(c => c.id)) + 1;
  }, [commentsList]);

  // Loading state
  if (loadingLoans || loadingComments) {
    return (
      <div className="p-4">
        <p className={styles.textMuted}>Loading...</p>
      </div>
    );
  }

  // Add new comment
  const addNewComment = () => {
    const newId = getNextCommentId();

    const newComment: Comment = {
      id: newId,
      loanNo: selectedLoan,
      commentType: 'Note',
      date: getTodayFormatted(),
      text: ''
    };
    addComment(newComment, {
      onSuccess: () => {
        setSelectedCommentId(newId);
        // Clear filters so new comment is visible
        setSearchText('');
        setFilterType('All');
        setFilterLoan('All');
      }
    });
  };

  // Handle comment field changes
  const handleCommentFieldChange = (field: keyof Comment, value: string) => {
    if (selectedCommentId) {
      updateComment({ id: selectedCommentId, updates: { [field]: value } });
    }
  };

  // Date validation on blur
  const handleDateBlur = (value: string) => {
    if (!value) {
      setDateError('');
      return;
    }
    if (!validateDateFormat(value)) {
      setDateError('Invalid date format. Use MM/DD/YY');
    } else {
      setDateError('');
    }
  };

  // Delete comment - show confirmation modal
  const requestDeleteComment = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const comment = commentsList.find(c => c.id === id);
    setDeleteConfirm({
      show: true,
      commentId: id,
      commentPreview: comment ? getCommentPreview(comment.text) : '(No text)'
    });
  };

  // Confirm delete
  const confirmDeleteComment = () => {
    const id = deleteConfirm.commentId;
    if (id === null) return;

    deleteComment(id, {
      onSuccess: () => {
        const remaining = commentsList.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setSelectedCommentId(remaining[0].id);
        }
      }
    });
    setDeleteConfirm({ show: false, commentId: null, commentPreview: '' });
  };

  // Cancel delete
  const cancelDeleteComment = () => {
    setDeleteConfirm({ show: false, commentId: null, commentPreview: '' });
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'date' ? 'desc' : 'asc');
    }
  };

  // Sort indicator
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ChevronUp size={12} className="inline ml-0.5" />
      : <ChevronDown size={12} className="inline ml-0.5" />;
  };

  // Type badge component
  const TypeBadge = ({ type }: { type: string }) => {
    const colors = TYPE_COLORS[type] || TYPE_COLORS.Other;
    const bgClass = theme === 'dark' ? colors.darkBg : colors.bg;
    const textClass = theme === 'dark' ? colors.darkText : colors.text;
    return (
      <span className={`${bgClass} ${textClass} px-1.5 py-0.5 rounded text-xs font-medium`}>
        {type}
      </span>
    );
  };

  return (
    <div className="p-4">
      {/* Delete Confirmation Modal */}
      <DeleteModal
        show={deleteConfirm.show}
        itemName={deleteConfirm.commentPreview}
        onConfirm={confirmDeleteComment}
        onCancel={cancelDeleteComment}
      />

      <div className="flex space-x-4">
        {/* Left Panel - Comments Table */}
        <div className={`${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`} style={{ width: '500px' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-medium ${styles.textPrimary}`}>Comments</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${styles.textMuted}`}>
                {filteredComments.length}{filteredComments.length !== commentsList.length ? ` / ${commentsList.length}` : ''} comments
              </span>
              <button
                onClick={addNewComment}
                className={`px-3 py-1.5 ${styles.cardBg} ${styles.inputBorder} border ${styles.textGreen} rounded transition-colors text-xs font-medium ${styles.buttonHover}`}
              >
                + Add Comment
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-3">
            <div className="relative">
              <Search size={14} className={`absolute left-2 top-1/2 -translate-y-1/2 ${styles.textMuted}`} />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search comments..."
                aria-label="Search comments"
                className={`${styles.inputBg} ${styles.inputBorder} border rounded pl-7 pr-7 py-1.5 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
              />
              {searchText && (
                <button
                  onClick={() => setSearchText('')}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 ${styles.textMuted} ${styles.hoverText}`}
                  aria-label="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex gap-2 mb-3">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              aria-label="Filter by type"
              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder} flex-1`}
            >
              <option value="All">All Types</option>
              {COMMENT_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filterLoan}
              onChange={(e) => setFilterLoan(e.target.value)}
              aria-label="Filter by loan"
              className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder} flex-1`}
            >
              <option value="All">All Loans</option>
              {loanNumbers.map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
            {(filterType !== 'All' || filterLoan !== 'All' || searchText) && (
              <button
                onClick={() => { setFilterType('All'); setFilterLoan('All'); setSearchText(''); }}
                className={`px-2 py-1 text-xs ${styles.textMuted} ${styles.hoverText} ${styles.inputBorder} border rounded`}
                title="Clear all filters"
              >
                Clear
              </button>
            )}
          </div>

          {/* Comments Table */}
          <div className={`${theme === 'dark' ? 'bg-zinc-900' : 'bg-white'} rounded border ${styles.borderColor} overflow-auto`} style={{ maxHeight: '600px' }}>
            <table className="w-full">
              <thead className={`sticky top-0 ${theme === 'dark' ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <tr className={`${styles.borderColor} border-b`}>
                  <th
                    className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs cursor-pointer select-none`}
                    onClick={() => handleSort('loanNo')}
                  >
                    Loan #<SortIcon field="loanNo" />
                  </th>
                  <th
                    className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs cursor-pointer select-none`}
                    onClick={() => handleSort('type')}
                  >
                    Type<SortIcon field="type" />
                  </th>
                  <th
                    className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs cursor-pointer select-none`}
                    onClick={() => handleSort('date')}
                  >
                    Date<SortIcon field="date" />
                  </th>
                  <th className={`text-left px-3 py-2 ${styles.textMuted} font-medium text-xs`}>Preview</th>
                  <th className={`px-2 py-2`} style={{ width: '30px' }}></th>
                </tr>
              </thead>
              <tbody>
                {filteredComments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={`px-3 py-6 text-center text-xs ${styles.textMuted}`}>
                      {commentsList.length === 0
                        ? 'No comments yet. Click "+ Add Comment" to create one.'
                        : 'No comments match your search/filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredComments.map(comment => (
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
                      <td className="px-3 py-2 text-xs">
                        <TypeBadge type={comment.commentType} />
                      </td>
                      <td className={`px-3 py-2 text-xs ${styles.textSecondary}`}>{comment.date}</td>
                      <td className={`px-3 py-2 text-xs ${styles.textSecondary}`}>{getCommentPreview(comment.text)}</td>
                      <td className="px-2 py-2">
                        <button
                          onClick={(e) => requestDeleteComment(comment.id, e)}
                          className={`${styles.textMuted} ${styles.hoverDanger} text-xs`}
                          title="Delete comment"
                          aria-label={`Delete comment ${comment.id}`}
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={`mt-3 text-xs ${styles.textMuted}`}>
            <p>Click a comment to view/edit. Click column headers to sort.</p>
          </div>
        </div>

        {/* Right Panel - Comment Detail */}
        {selectedComment ? (
          <div className={`flex-1 ${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border`}>
            <h3 className={`font-medium mb-4 ${styles.textPrimary}`}>Comment Details</h3>

            <div className="space-y-4">
              {/* Loan Number, Type, and Date */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={`text-xs ${styles.textMuted} block mb-1`}>Loan Number:</label>
                  <select
                    value={selectedComment.loanNo}
                    onChange={(e) => handleCommentFieldChange('loanNo', e.target.value)}
                    aria-label="Loan Number"
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} font-medium focus:outline-none ${styles.focusBorder}`}
                  >
                    {(loans || []).map(loan => (
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
                    aria-label="Comment Type"
                    className={`${styles.inputBg} ${styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  >
                    {COMMENT_TYPES.map(type => (
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
                    onBlur={(e) => handleDateBlur(e.target.value)}
                    aria-label="Comment Date"
                    placeholder="MM/DD/YY"
                    className={`${styles.inputBg} ${dateError ? styles.invalidBorder : styles.inputBorder} border rounded px-2 py-1 w-full text-xs ${styles.textPrimary} focus:outline-none ${styles.focusBorder}`}
                  />
                  {dateError && (
                    <p className={`text-xs ${styles.textRed} mt-0.5`}>{dateError}</p>
                  )}
                </div>
              </div>

              {/* Comment Type Badge Display */}
              <div className="flex items-center gap-2">
                <TypeBadge type={selectedComment.commentType} />
                <span className={`text-xs ${styles.textMuted}`}>
                  Loan {selectedComment.loanNo} &middot; {selectedComment.date}
                </span>
              </div>

              {/* Comment Text */}
              <div>
                <label className={`text-xs ${styles.textMuted} block mb-1`}>Comment Text:</label>
                <textarea
                  value={selectedComment.text}
                  onChange={(e) => handleCommentFieldChange('text', e.target.value)}
                  aria-label="Comment Text"
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
                  <p className="mt-1">SELECT * FROM comments WHERE loan_id = '{selectedLoan}'</p>
                  <p>INSERT INTO comments (loan_id, comment_type, date, text) VALUES (...)</p>
                  <p>UPDATE comments SET field = value WHERE id = {selectedCommentId}</p>
                  <p>DELETE FROM comments WHERE id = comment_id</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`flex-1 ${styles.cardBg} rounded-lg p-4 ${styles.inputBorder} border flex items-center justify-center`}>
            <p className={`text-sm ${styles.textMuted}`}>
              {commentsList.length === 0
                ? 'No comments yet. Click "+ Add Comment" to get started.'
                : 'Select a comment from the list to view details.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
CommentTab.displayName = 'CommentTab';
