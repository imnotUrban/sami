'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Comment, CommentFilters } from '@/lib/api';
import { useComments } from '@/lib/use-comments';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageCircle, Edit2, Trash2, Reply, Filter, RefreshCw } from 'lucide-react';
import { CommentForm } from './comment-form';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommentListProps {
  projectId: number;
  serviceId?: number;
  autoRefresh?: boolean;
  showFilters?: boolean;
  maxHeight?: string;
}

export const CommentList: React.FC<CommentListProps> = ({
  projectId,
  serviceId,
  autoRefresh = false,
  showFilters = true,
  maxHeight = "600px"
}) => {
  const {
    comments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment,
    getCommentReplies,
    filteredComments,
    setFilters,
    filters,
    refreshComments
  } = useComments({ projectId, autoRefresh });

  const [showCommentForm, setShowCommentForm] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get type color for badges
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'issue':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'improvement':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  // Get user initials for avatar
  const getUserInitials = (name: string | undefined | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Toggle comment expansion
  const toggleCommentExpansion = (commentId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof CommentFilters, value: string | undefined) => {
    const newFilters = {
      ...filters,
      [key]: value === 'all' ? undefined : value
    };
    setFilters(newFilters);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshComments();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (content: string, type: 'general' | 'issue' | 'improvement') => {
    const commentData = {
      content,
      type,
      service_id: serviceId,
      parent_id: replyingTo?.id
    };

    try {
      if (editingComment) {
        await updateComment(editingComment.id, { content });
        setEditingComment(null);
      } else {
        await createComment(commentData);
      }

      setShowCommentForm(false);
      setReplyingTo(null);
    } catch (error) {
      console.error('Error handling comment submission:', error);
      // Error is handled by the form component
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  // Filter comments to show only top-level comments (not replies)
  const topLevelComments = filteredComments.filter(comment => !comment.parent_id);

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-sm text-gray-500">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with title and filters */}
      <div className="flex flex-col gap-4">
        {/* Title and filters row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            <h3 className="text-lg font-semibold">
              Comments ({topLevelComments.length})
            </h3>
          </div>

          {showFilters && (
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <Select
                value={filters.type || 'all'}
                onValueChange={(value) => handleFilterChange('type', value)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="issue">Issues</SelectItem>
                  <SelectItem value="improvement">Improvements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Action buttons row */}
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={() => setShowCommentForm(true)}
            size="sm"
          >
            Add Comment
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Comment form */}
      {showCommentForm && (
        <Card>
          <CardHeader>
            <h4 className="text-sm font-medium">
              {editingComment ? 'Edit Comment' : replyingTo ? `Reply to ${replyingTo.user.name}` : 'New Comment'}
            </h4>
          </CardHeader>
          <CardContent>
            <CommentForm
              initialContent={editingComment?.content || ''}
              initialType={editingComment?.type || 'general'}
              onSubmit={handleCommentSubmit}
              onCancel={() => {
                setShowCommentForm(false);
                setEditingComment(null);
                setReplyingTo(null);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Comments list */}
      <div 
        className="space-y-3 overflow-y-auto"
        style={{ maxHeight }}
      >
        {topLevelComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No comments yet. Be the first to add one!</p>
          </div>
        ) : (
          topLevelComments.map((comment) => {
            const replies = getCommentReplies(comment.id);
            const isExpanded = expandedComments.has(comment.id);

            return (
              <Card key={comment.id} className="relative">
                <CardContent className="p-4">
                  {/* Comment header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(comment.user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{comment.user.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <Badge className={getTypeColor(comment.type)}>
                        {comment.type}
                      </Badge>
                    </div>

                    {/* Comment actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setReplyingTo(comment);
                          setShowCommentForm(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Reply className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingComment(comment);
                          setShowCommentForm(true);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Comment content */}
                  <div className="prose prose-sm max-w-none mb-3">
                    <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                  </div>

                  {/* Replies toggle */}
                  {replies.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleCommentExpansion(comment.id)}
                      className="text-blue-600 hover:text-blue-700 p-0 h-auto"
                    >
                      {isExpanded ? 'Hide' : 'Show'} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                    </Button>
                  )}

                  {/* Replies */}
                  {isExpanded && replies.length > 0 && (
                    <div className="mt-4 ml-2 sm:ml-6 space-y-3 border-l-2 border-gray-100 pl-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(reply.user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{reply.user.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingComment(reply);
                                  setShowCommentForm(true);
                                }}
                                className="h-7 w-7 p-0"
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}; 