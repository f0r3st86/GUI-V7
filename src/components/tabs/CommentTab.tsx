// CommentTab component - displays comments for loans in the relationship
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTheme, useLoan } from '../../context';
import { COMMENT_TYPES } from '../../data';
import { getCommentPreview } from '../../utils';
import {
  useLoans,
  useComments,
  useAddComment,
  useUpdateComment,
  useDeleteComment
} from '../../hooks';
import type { Comment } from '../../types';

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

  // Computed values
  const commentsList = React.useMemo(
    () => comments || [],
    [comments]
  );

  const selectedComment = React.useMemo(
    () => commentsList.find(c => c.id === selectedCommentId),
    [commentsList, selectedCommentId]
  );

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
    const today = new Date();
    const dateStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear().toString().slice(-2)}`;

    const newComment: Comment = {
      id: newId,
      loanNo: selectedLoan,
      commentType: 'Note',
      date: dateStr,
      text: ''
    };
    addComment(newComment, {
      onSuccess: () => {
        setSelectedCommentId(newId);
      }
    });
  };

  // Handle comment field changes
  const handleCommentFieldChange = (field: keyof Comment, value: string) => {
    if (selectedCommentId) {
      updateComment({ id: selectedCommentId, updates: { [field]: value } });
    }
  };

  // Delete comment
  const handleDeleteComment = (id: number) => {
    if (commentsList.length <= 1) return;

    deleteComment(id, {
      onSuccess: () => {
        // Select another comment
        const remaining = commentsList.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setSelectedCommentId(remaining[0].id);
        }
      }
    });
  };

  return (
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
                            handleDeleteComment(comment.id);
                          }}
                          className={`${styles.textMuted} ${styles.hoverDanger} text-xs`}
                          title="Delete comment"
                        >
                          x
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`mt-3 text-xs ${styles.textMuted}`}>
            <p>Click a comment to view/edit</p>
            <p>Click + Add Comment to create new</p>
            <p>Click x to delete a comment</p>
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
                  <p className="mt-1">SELECT * FROM comments WHERE loan_id = '{selectedLoan}'</p>
                  <p>INSERT INTO comments (loan_id, comment_type, date, text) VALUES (...)</p>
                  <p>UPDATE comments SET field = value WHERE id = {selectedCommentId}</p>
                  <p>DELETE FROM comments WHERE id = comment_id</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
CommentTab.displayName = 'CommentTab';
