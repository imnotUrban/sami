'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageCircle, 
  Search, 
  AlertTriangle, 
  Lightbulb, 
  MessageSquare, 
  TrendingUp, 
  RefreshCw,
  Eye,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { commentApi, projectApi, Comment, Project } from '@/lib/api';

interface CommentsStats {
  total: number;
  byType: {
    general: number;
    issue: number;
    improvement: number;
  };
  recent: number;
  thisWeek: number;
}

export default function CommentsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'general' | 'issue' | 'improvement'>('all');
  const [selectedProject, setSelectedProject] = useState<'all' | number>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  // Fetch data
  const fetchData = async () => {
    try {
      setError(null);
      
      // Get all comments in one call (optimized!)
      const comments = await commentApi.getAllComments();
      setAllComments(comments);

      // Get unique projects from comments for filter dropdown
      const uniqueProjectIds = [...new Set(comments.map(c => c.project_id))];
      const projectsFromComments = comments
        .filter(c => c.project)
        .reduce((acc, comment) => {
          if (!acc.find(p => p.id === comment.project!.id)) {
            acc.push(comment.project!);
          }
          return acc;
        }, [] as Project[]);

      // If we don't have all projects info from comments, fetch missing ones
      if (projectsFromComments.length < uniqueProjectIds.length) {
        const userProjects = await projectApi.getProjects();
        setProjects(userProjects);
      } else {
        setProjects(projectsFromComments);
      }

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load comments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    setIsRefreshing(false);
  };

  // Calculate statistics
  const stats: CommentsStats = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter out deleted comments (only count active comments)
    const activeComments = allComments.filter(c => !c.deleted_at);

    return {
      total: activeComments.length,
      byType: {
        general: activeComments.filter(c => c.type === 'general').length,
        issue: activeComments.filter(c => c.type === 'issue').length,
        improvement: activeComments.filter(c => c.type === 'improvement').length,
      },
      recent: activeComments.filter(c => new Date(c.created_at) > oneDayAgo).length,
      thisWeek: activeComments.filter(c => new Date(c.created_at) > oneWeekAgo).length,
    };
  }, [allComments]);

  // Helper function to check if a comment matches filters
  const matchesFilters = useCallback((comment: Comment) => {
    // Skip deleted comments
    if (comment.deleted_at) return false;
    
    // Type filter
    if (selectedType !== 'all' && comment.type !== selectedType) {
      return false;
    }

    // Project filter
    if (selectedProject !== 'all' && comment.project_id !== selectedProject) {
      return false;
    }

    return true;
  }, [selectedType, selectedProject]);

  // Organize comments into hierarchy and filter
  const { topLevelComments, filteredComments } = useMemo(() => {
    // Filter out deleted comments first
    const activeComments = allComments.filter(comment => !comment.deleted_at);
    
    // Separate top-level comments from replies
    const topLevel = activeComments.filter(comment => !comment.parent_id);
    const repliesMap = new Map<number, Comment[]>();
    
    // Group replies by parent_id
    activeComments.filter(comment => comment.parent_id).forEach(reply => {
      const parentId = reply.parent_id!;
      if (!repliesMap.has(parentId)) {
        repliesMap.set(parentId, []);
      }
      repliesMap.get(parentId)!.push(reply);
    });

    // Attach replies to top-level comments
    const commentsWithReplies = topLevel.map(comment => ({
      ...comment,
      replies: repliesMap.get(comment.id) || []
    }));

    // Apply filters to both comments and replies
    const filtered = commentsWithReplies.filter(comment => {
      // Check main comment
      const mainMatches = matchesFilters(comment);
      
      // Check replies
      const matchingReplies = comment.replies.filter(reply => matchesFilters(reply));
      
      // Include if main comment matches OR if any reply matches
      if (mainMatches || matchingReplies.length > 0) {
        return true;
      }
      
      return false;
    }).map(comment => ({
      ...comment,
      replies: comment.replies.filter(reply => matchesFilters(reply))
    }));

    return {
      topLevelComments: commentsWithReplies,
      filteredComments: filtered
    };
  }, [allComments, selectedType, selectedProject, matchesFilters]);

  // Get project name for a comment
  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  // Get user display name with fallback
  const getUserDisplayName = (user: any) => {
    if (!user) return 'Unknown User';
    return user.full_name || user.name || user.email || 'Unknown User';
  };

  // Get user initials
  const getUserInitials = (name: string | undefined | null) => {
    if (!name || name === 'Unknown User') return 'U';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get type info
  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'issue':
        return {
          color: 'bg-red-100 text-red-800 hover:bg-red-200',
          icon: AlertTriangle,
          label: 'Issue'
        };
      case 'improvement':
        return {
          color: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
          icon: Lightbulb,
          label: 'Improvement'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
          icon: MessageSquare,
          label: 'General'
        };
    }
  };

  // Handle actions
  const handleViewProject = (projectId: number) => {
    router.push(`/dashboard/projects/${projectId}`);
  };

  const handleDeleteComment = async (commentId: number) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentApi.deleteComment(commentId);
        await fetchData();
      } catch (err) {
        console.error('Error deleting comment:', err);
        setError('Failed to delete comment. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <Layout title="Comments">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading comments...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Comments">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Comments</h1>
            <p className="text-gray-600">Manage and review all project comments</p>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byType.issue}</p>
                </div>
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Improvements</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byType.improvement}</p>
                </div>
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Lightbulb className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                className="px-3 py-2 text-sm border border-gray-200 bg-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
              >
                <option value="all">All Types</option>
                <option value="general">General</option>
                <option value="issue">Issues</option>
                <option value="improvement">Improvements</option>
              </select>

              {/* Project Filter */}
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-200 bg-white rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[160px]"
              >
                <option value="all">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Comments List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Comments ({filteredComments.length})
              {filteredComments.reduce((total, comment) => total + comment.replies.length, 0) > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  (+{filteredComments.reduce((total, comment) => total + comment.replies.length, 0)} replies)
                </span>
              )}
            </h2>
          </div>

          {filteredComments.length === 0 ? (
            <Card className="shadow-sm border-0 ring-1 ring-gray-200">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No comments found</h3>
                <p className="text-gray-500 text-center max-w-md">
                  {selectedType !== 'all' || selectedProject !== 'all'
                    ? 'No comments match your current filters. Try adjusting your search criteria.'
                    : 'No comments have been made yet. Comments will appear here once team members start discussing projects.'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredComments.map((comment) => {
                const typeInfo = getTypeInfo(comment.type);
                const TypeIcon = typeInfo.icon;

                return (
                  <div key={comment.id} className="space-y-3">
                    {/* Main Comment */}
                    <Card className="shadow-sm border-0 ring-1 ring-gray-200 hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start space-x-3 flex-1">
                            {/* Avatar */}
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                                {getUserInitials(getUserDisplayName(comment.user))}
                              </AvatarFallback>
                            </Avatar>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium text-gray-900">{getUserDisplayName(comment.user)}</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-sm text-gray-500">
                                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                </span>
                                <Badge className={typeInfo.color}>
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {typeInfo.label}
                                </Badge>
                                {comment.replies.length > 0 && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                    {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                                  </Badge>
                                )}
                              </div>

                              {/* Project Info */}
                              <div className="flex items-center gap-2 mb-2">
                                <FolderOpen className="w-4 h-4 text-gray-400" />
                                <button
                                  onClick={() => handleViewProject(comment.project_id)}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {getProjectName(comment.project_id)}
                                </button>
                              </div>

                              {/* Comment Content */}
                              <div className="prose prose-sm max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap break-words">{comment.content}</p>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewProject(comment.project_id)}
                              className="h-8 w-8 p-0"
                              title="View Project"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Delete Comment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="ml-8 space-y-2">
                        {comment.replies.map((reply) => {
                          const replyTypeInfo = getTypeInfo(reply.type);
                          const ReplyTypeIcon = replyTypeInfo.icon;

                          return (
                            <Card key={reply.id} className="shadow-sm border-0 ring-1 ring-gray-100 bg-gray-50/50">
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-start space-x-2 flex-1">
                                    {/* Reply Avatar */}
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-600 text-white text-xs font-semibold">
                                        {getUserInitials(getUserDisplayName(reply.user))}
                                      </AvatarFallback>
                                    </Avatar>

                                    {/* Reply Content */}
                                    <div className="flex-1 min-w-0">
                                      {/* Reply Header */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm text-gray-900">{getUserDisplayName(reply.user)}</span>
                                        <span className="text-gray-400">•</span>
                                        <span className="text-xs text-gray-500">
                                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                        </span>
                                        <Badge className={`text-xs ${replyTypeInfo.color}`}>
                                          <ReplyTypeIcon className="w-2 h-2 mr-1" />
                                          {replyTypeInfo.label}
                                        </Badge>
                                      </div>

                                      {/* Reply Content */}
                                      <div className="prose prose-sm max-w-none">
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">{reply.content}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Reply Actions */}
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteComment(reply.id)}
                                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      title="Delete Reply"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 