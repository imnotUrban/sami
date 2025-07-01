'use client';

import { useState, useEffect, useCallback } from 'react';
import { commentApi, Comment, CreateCommentData, UpdateCommentData, CommentFilters } from './api';

export interface UseCommentsOptions {
  projectId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseCommentsReturn {
  comments: Comment[];
  loading: boolean;
  error: string | null;
  createComment: (data: CreateCommentData) => Promise<Comment | null>;
  updateComment: (commentId: number, data: UpdateCommentData) => Promise<Comment | null>;
  deleteComment: (commentId: number) => Promise<boolean>;
  refreshComments: (filters?: CommentFilters) => Promise<void>;
  getCommentById: (commentId: number) => Comment | undefined;
  getCommentReplies: (parentId: number) => Comment[];
  filteredComments: Comment[];
  setFilters: (filters: CommentFilters) => void;
  filters: CommentFilters;
}

export const useComments = ({ 
  projectId, 
  autoRefresh = false, 
  refreshInterval = 30000 
}: UseCommentsOptions): UseCommentsReturn => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CommentFilters>({});

  // Get filtered comments based on current filters
  const filteredComments = comments.filter(comment => {
    if (filters.service_id && comment.service_id !== filters.service_id) {
      return false;
    }
    if (filters.type && comment.type !== filters.type) {
      return false;
    }
    return true;
  });

  // Refresh comments from API
  const refreshComments = useCallback(async (newFilters?: CommentFilters) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedComments = await commentApi.getProjectComments(projectId, newFilters || filters);
      setComments(fetchedComments);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comments');
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, filters]);

  // Create a new comment
  const createComment = useCallback(async (data: CreateCommentData): Promise<Comment | null> => {
    try {
      setError(null);
      const newComment = await commentApi.createComment(projectId, data);
      
      // Add to local state for immediate UI update
      setComments(prev => [newComment, ...prev]);
      
      return newComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create comment');
      console.error('Error creating comment:', err);
      return null;
    }
  }, [projectId]);

  // Update an existing comment
  const updateComment = useCallback(async (commentId: number, data: UpdateCommentData): Promise<Comment | null> => {
    try {
      setError(null);
      const updatedComment = await commentApi.updateComment(commentId, data);
      
      // Update local state
      setComments(prev => 
        prev.map(comment => 
          comment.id === commentId ? updatedComment : comment
        )
      );
      
      return updatedComment;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment');
      console.error('Error updating comment:', err);
      return null;
    }
  }, []);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: number): Promise<boolean> => {
    try {
      setError(null);
      await commentApi.deleteComment(commentId);
      
      // Remove from local state (or mark as deleted)
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment');
      console.error('Error deleting comment:', err);
      return false;
    }
  }, []);

  // Get comment by ID
  const getCommentById = useCallback((commentId: number): Comment | undefined => {
    return comments.find(comment => comment.id === commentId);
  }, [comments]);

  // Get replies for a specific comment
  const getCommentReplies = useCallback((parentId: number): Comment[] => {
    return comments.filter(comment => comment.parent_id === parentId);
  }, [comments]);

  // Update filters - Fixed function name and implementation
  const handleSetFilters = useCallback((newFilters: CommentFilters) => {
    setFilters(newFilters);
    // Don't auto-refresh here to avoid infinite loops
  }, []);

  // Effect to refresh when filters change
  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      refreshComments(filters);
    }
  }, [filters, refreshComments]);

  // Initial load
  useEffect(() => {
    refreshComments();
  }, [refreshComments]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      refreshComments();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshComments]);

  return {
    comments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment,
    refreshComments,
    getCommentById,
    getCommentReplies,
    filteredComments,
    setFilters: handleSetFilters,
    filters,
  };
}; 