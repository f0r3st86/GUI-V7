// Comment Context - manages comment-related state
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import type { Comment, CommentContextType } from '../types';
import { initialComments } from '../data';

// Create context
const CommentContext = createContext<CommentContextType | undefined>(undefined);

interface CommentProviderProps {
  children: ReactNode;
}

// Provider component
export const CommentProvider: React.FC<CommentProviderProps> = ({ children }) => {
  // Comment state
  const [commentsList, setCommentsList] = useState<Comment[]>(initialComments);
  const [selectedCommentId, setSelectedCommentId] = useState<number>(1);

  // Get selected comment
  const selectedComment = useMemo(() =>
    commentsList.find(c => c.id === selectedCommentId),
    [commentsList, selectedCommentId]
  );

  // ID generator
  const getNextCommentId = useCallback((): number => {
    return Math.max(...commentsList.map(c => c.id), 0) + 1;
  }, [commentsList]);

  // Context value
  const value = useMemo<CommentContextType>(() => ({
    commentsList,
    setCommentsList,
    selectedCommentId,
    setSelectedCommentId,
    selectedComment,
    getNextCommentId,
  }), [
    commentsList, selectedCommentId, selectedComment, getNextCommentId
  ]);

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
};

// Custom hook to use comment context
export const useComment = (): CommentContextType => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComment must be used within a CommentProvider');
  }
  return context;
};
