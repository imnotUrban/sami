'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommentFormProps {
  initialContent?: string;
  initialType?: 'general' | 'issue' | 'improvement';
  onSubmit: (content: string, type: 'general' | 'issue' | 'improvement') => Promise<void>;
  onCancel: () => void;
  submitText?: string;
  isLoading?: boolean;
}

const MAX_COMMENT_LENGTH = 1000;

export const CommentForm: React.FC<CommentFormProps> = ({
  initialContent = '',
  initialType = 'general',
  onSubmit,
  onCancel,
  submitText = 'Submit',
  isLoading = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [type, setType] = useState<'general' | 'issue' | 'improvement'>(initialType);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset error
    setError('');
    
    // Validation
    if (!content.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      setError(`Comment must be ${MAX_COMMENT_LENGTH} characters or less`);
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(content.trim(), type);
      setContent('');
      setType('general');
      setError('');
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('Failed to submit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = !content.trim() || submitting || isLoading || content.length > MAX_COMMENT_LENGTH;
  const remainingChars = MAX_COMMENT_LENGTH - content.length;
  const isNearLimit = remainingChars < 100;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="comment-type">Comment Type</Label>
        <Select
          value={type}
          onValueChange={(value: 'general' | 'issue' | 'improvement') => setType(value)}
          disabled={submitting || isLoading}
        >
          <SelectTrigger id="comment-type">
            <SelectValue placeholder="Select comment type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="issue">Issue</SelectItem>
            <SelectItem value="improvement">Improvement</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment-content">Comment</Label>
        <Textarea
          id="comment-content"
          placeholder="Write your comment here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={submitting || isLoading}
          rows={4}
          className={`resize-none ${content.length > MAX_COMMENT_LENGTH ? 'border-red-500' : ''}`}
        />
        <div className={`text-xs text-right ${isNearLimit ? 'text-orange-600' : content.length > MAX_COMMENT_LENGTH ? 'text-red-600' : 'text-gray-500'}`}>
          {remainingChars} characters remaining
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting || isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isDisabled}
          className="min-w-[80px]"
        >
          {submitting ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Submitting...
            </div>
          ) : (
            submitText
          )}
        </Button>
      </div>
    </form>
  );
}; 