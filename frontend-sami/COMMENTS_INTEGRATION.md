# Comments Integration Guide

This guide explains how to integrate the comments functionality into your existing pages.

## Components Overview

### 1. API Functions (`/lib/api.ts`)
- `commentApi.getProjectComments()` - Get comments for a project
- `commentApi.createComment()` - Create a new comment
- `commentApi.updateComment()` - Update an existing comment
- `commentApi.deleteComment()` - Delete a comment
- `commentApi.getComment()` - Get a specific comment

### 2. Custom Hook (`/lib/use-comments.ts`)
- `useComments()` - React hook for managing comments state and operations

### 3. UI Components
- `CommentList` - Display and manage comments
- `CommentForm` - Form for creating/editing comments
- `ProjectCommentsPanel` - Complete panel for project comments

## Basic Usage

### 1. Simple Comment List

```tsx
import { CommentList } from '@/components/comment-list';

function ProjectPage({ projectId }: { projectId: number }) {
  return (
    <div>
      <h1>Project Details</h1>
      
      {/* Comments section */}
      <div className="mt-8">
        <CommentList 
          projectId={projectId} 
          autoRefresh={true}
          showFilters={true}
        />
      </div>
    </div>
  );
}
```

### 2. Service-Specific Comments

```tsx
import { CommentList } from '@/components/comment-list';

function ServicePage({ projectId, serviceId }: { projectId: number, serviceId: number }) {
  return (
    <div>
      <h1>Service Details</h1>
      
      {/* Service comments */}
      <CommentList 
        projectId={projectId}
        serviceId={serviceId}
        showFilters={false}
        maxHeight="400px"
      />
    </div>
  );
}
```

### 3. Floating Comments Panel

```tsx
import { ProjectCommentsPanel } from '@/components/project-comments-panel';
import { useState } from 'react';

function ProjectDashboard({ projectId }: { projectId: number }) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div>
      <h1>Project Dashboard</h1>
      
      {/* Main content */}
      <div>
        {/* Your existing content */}
      </div>
      
      {/* Floating comments panel */}
      <ProjectCommentsPanel
        projectId={projectId}
        isOpen={showComments}
        onToggle={() => setShowComments(!showComments)}
        className="fixed bottom-4 right-4 z-50"
      />
    </div>
  );
}
```

## Advanced Usage

### 1. Using the Hook Directly

```tsx
import { useComments } from '@/lib/use-comments';
import { useState } from 'react';

function CustomCommentsSection({ projectId }: { projectId: number }) {
  const {
    comments,
    loading,
    error,
    createComment,
    updateComment,
    deleteComment,
    refreshComments
  } = useComments({ projectId, autoRefresh: true });

  const [newComment, setNewComment] = useState('');

  const handleSubmit = async () => {
    if (newComment.trim()) {
      await createComment({
        content: newComment,
        type: 'general'
      });
      setNewComment('');
    }
  };

  if (loading) return <div>Loading comments...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h3>Comments ({comments.length})</h3>
      
      {/* Create comment */}
      <div className="mb-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-2 border rounded"
        />
        <button onClick={handleSubmit} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
          Add Comment
        </button>
      </div>
      
      {/* Comments list */}
      <div>
        {comments.map(comment => (
          <div key={comment.id} className="p-3 border-b">
            <div className="font-medium">{comment.user.name}</div>
            <div className="text-sm text-gray-500">{comment.type}</div>
            <div className="mt-1">{comment.content}</div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => updateComment(comment.id, { content: 'Updated!' })}
                className="text-sm text-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => deleteComment(comment.id)}
                className="text-sm text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 2. Filtering Comments

```tsx
import { CommentList } from '@/components/comment-list';
import { useState } from 'react';

function FilteredComments({ projectId }: { projectId: number }) {
  const [currentFilter, setCurrentFilter] = useState<'all' | 'issues' | 'improvements'>('all');

  const getFilterConfig = () => {
    switch (currentFilter) {
      case 'issues':
        return { type: 'issue' as const };
      case 'improvements':
        return { type: 'improvement' as const };
      default:
        return {};
    }
  };

  return (
    <div>
      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setCurrentFilter('all')}
          className={`px-3 py-1 rounded ${currentFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All
        </button>
        <button
          onClick={() => setCurrentFilter('issues')}
          className={`px-3 py-1 rounded ${currentFilter === 'issues' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
        >
          Issues
        </button>
        <button
          onClick={() => setCurrentFilter('improvements')}
          className={`px-3 py-1 rounded ${currentFilter === 'improvements' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
        >
          Improvements
        </button>
      </div>
      
      {/* Comments with applied filter */}
      <CommentList
        projectId={projectId}
        // You can implement custom filtering or use the built-in filters
      />
    </div>
  );
}
```

## Integration Examples

### Adding Comments to Existing Project Page

```tsx
// src/app/dashboard/projects/[id]/page.tsx
import { CommentList } from '@/components/comment-list';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id);

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Your existing project details */}
          <ProjectDetails projectId={projectId} />
        </div>
        
        {/* Comments sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <CommentList
              projectId={projectId}
              autoRefresh={true}
              maxHeight="600px"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Adding Comments to Service Pages

```tsx
// src/app/dashboard/projects/[id]/services/page.tsx
import { ProjectCommentsPanel } from '@/components/project-comments-panel';

export default function ServicesPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="relative">
      {/* Your existing services content */}
      <ServicesFlow
        projectId={projectId}
        onServiceSelect={setSelectedService}
      />
      
      {/* Floating comments panel */}
      <ProjectCommentsPanel
        projectId={projectId}
        serviceId={selectedService || undefined}
        isOpen={showComments}
        onToggle={() => setShowComments(!showComments)}
        className="fixed bottom-4 right-4 z-50 shadow-xl"
      />
    </div>
  );
}
```

## Configuration Options

### CommentList Props
- `projectId: number` - Required. The project ID
- `serviceId?: number` - Optional. Filter comments for specific service
- `autoRefresh?: boolean` - Auto-refresh comments every 30 seconds
- `showFilters?: boolean` - Show type filters
- `maxHeight?: string` - Max height for scrollable area

### useComments Options
- `projectId: number` - Required. The project ID
- `autoRefresh?: boolean` - Enable auto-refresh
- `refreshInterval?: number` - Refresh interval in milliseconds (default: 30000)

## TypeScript Interfaces

```typescript
interface Comment {
  id: number;
  project_id: number;
  user_id: number;
  service_id?: number;
  parent_id?: number;
  content: string;
  type: 'general' | 'issue' | 'improvement';
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  user: User;
  replies?: Comment[];
}

interface CreateCommentData {
  content: string;
  type: 'general' | 'issue' | 'improvement';
  service_id?: number;
  parent_id?: number;
}

interface UpdateCommentData {
  content: string;
}

interface CommentFilters {
  service_id?: number;
  type?: 'general' | 'issue' | 'improvement';
}
```

## Best Practices

1. **Use Auto-refresh Sparingly**: Only enable auto-refresh on pages where real-time updates are important
2. **Filter Comments**: Use service-specific filtering for service detail pages
3. **Handle Loading States**: Always show loading indicators while fetching comments
4. **Error Handling**: Display user-friendly error messages
5. **Optimistic Updates**: The hook provides optimistic updates for better UX
6. **Responsive Design**: Comments components are responsive by default

## Styling

All components use Tailwind CSS classes and shadcn/ui components. You can customize the appearance by:

1. Overriding CSS classes via the `className` prop
2. Modifying the component source code for deeper customization
3. Using CSS-in-JS or styled-components if needed

The components follow the existing design system and will integrate seamlessly with your current UI. 