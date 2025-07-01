'use client';

import React, { useState, useEffect } from 'react';
import { CommentList } from './comment-list';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageCircle, X, Minimize2, Maximize2 } from 'lucide-react';

interface ProjectCommentsPanelProps {
  projectId: number;
  serviceId?: number;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const ProjectCommentsPanel: React.FC<ProjectCommentsPanelProps> = ({
  projectId,
  serviceId,
  isOpen = true,
  onToggle,
  className = ""
}) => {
  const [activeTab, setActiveTab] = useState<string>(serviceId ? 'service' : 'all');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update active tab when serviceId changes
  useEffect(() => {
    if (serviceId) {
      setActiveTab('service');
    }
  }, [serviceId]);

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onToggle}
        className={`fixed bottom-4 right-4 z-50 shadow-lg hover:shadow-xl transition-shadow ${className}`}
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Comments
      </Button>
    );
  }

  const panelContent = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          <h3 className="font-semibold">Comments</h3>
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      {!isMinimized && (
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Comments</TabsTrigger>
              <TabsTrigger value="service" disabled={!serviceId}>
                {serviceId ? 'Service Comments' : 'No Service'}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <CommentList
                projectId={projectId}
                autoRefresh={true}
                showFilters={true}
                maxHeight={isMobile ? "300px" : "400px"}
              />
            </TabsContent>
            
            <TabsContent value="service" className="mt-4">
              {serviceId ? (
                <CommentList
                  projectId={projectId}
                  serviceId={serviceId}
                  autoRefresh={true}
                  showFilters={false}
                  maxHeight={isMobile ? "300px" : "400px"}
                />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No service selected</p>
                  <p className="text-xs mt-1">Select a service to view its comments</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </>
  );

  // Mobile: Full screen overlay
  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-50 bg-white ${className}`}>
        <Card className="h-full rounded-none border-0">
          {panelContent}
        </Card>
      </div>
    );
  }

  // Desktop: Sidebar panel
  return (
    <Card className={`w-full max-w-md transition-all duration-200 ${isMinimized ? 'h-auto' : ''} ${className}`}>
      {panelContent}
    </Card>
  );
}; 