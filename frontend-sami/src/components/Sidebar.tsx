'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  FolderOpen,
  Users,
  MessageCircle,
  HelpCircle,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_login?: string;
}

const navigationItems = [
  {
    title: 'Main',
    items: [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        description: 'System overview'
      },
      {
        name: 'Projects',
        href: '/dashboard/projects',
        icon: FolderOpen,
        description: 'Manage architecture projects'
      },
      {
        name: 'Comments',
        href: '/dashboard/comments',
        icon: MessageCircle,
        description: 'Review project comments'
      },
      {
        name: 'Users',
        href: '/dashboard/users',
        icon: Users,
        description: 'User management'
      },
      {
        name: 'Profile',
        href: '/dashboard/profile',
        icon: User,
        description: 'Manage your profile and settings'
      }
    ]
  }
];

export default function Sidebar({ isOpen = true, onClose, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleNavigation = (href: string) => {
    router.push(href);
    if (onClose) onClose();
  };

  // Filter navigation items based on user role
  const getFilteredNavigationItems = () => {
    return navigationItems.map(section => ({
      ...section,
      items: section.items.filter(item => {
        // Show Users only if user is admin
        if (item.name === 'Users') {
          return user?.role === 'admin';
        }
        return true;
      })
    }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-full bg-white border-r border-gray-200 shadow-lg transform transition-all duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",
          "w-64" // Always full width on mobile
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Image 
              src="/sami_logoxd.png" 
              alt="SAMI Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
            {!isCollapsed && (
              <span className="text-lg font-semibold text-gray-900">SAMI</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Collapse Toggle Button - Desktop Only - Only when expanded */}
            {onToggleCollapse && !isCollapsed && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="hidden lg:flex hover:bg-gray-100 transition-colors"
                title="Contraer menú"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            
            {/* Close Button - Mobile Only */}
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="lg:hidden hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Collapse/Expand Button for collapsed state - Fixed positioning */}
        {isCollapsed && onToggleCollapse && (
          <div className="absolute -right-3 top-20 z-50 hidden lg:block">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleCollapse}
              className="w-6 h-6 p-0 bg-white border border-gray-300 shadow-md hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 rounded-full"
              title="Expandir menú"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="space-y-8">
            {getFilteredNavigationItems().map((section) => (
              <div key={section.title}>
                {!isCollapsed && (
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;
                    
                    return (
                      <button
                        key={item.name}
                        onClick={() => handleNavigation(item.href)}
                        className={cn(
                          "w-full flex items-center text-sm font-medium rounded-lg transition-colors duration-200",
                          isCollapsed ? "px-2 py-3 justify-center" : "px-3 py-2",
                          isActive
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5",
                            isCollapsed ? "mx-auto" : "mr-3",
                            isActive ? "text-blue-600" : "text-gray-400"
                          )}
                        />
                        {!isCollapsed && (
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500 hidden lg:block">
                              {item.description}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full",
              isCollapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={() => handleNavigation('/docs')}
            title={isCollapsed ? "API Documentation" : undefined}
          >
            <BookOpen className={cn(
              "h-4 w-4 text-gray-400",
              isCollapsed ? "mx-auto" : "mr-3"
            )} />
            {!isCollapsed && (
              <span className="text-sm text-gray-700">API Documentation</span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full",
              isCollapsed ? "justify-center px-2" : "justify-start"
            )}
            onClick={() => handleNavigation('/help')}
            title={isCollapsed ? "About SAMI" : undefined}
          >
            <HelpCircle className={cn(
              "h-4 w-4 text-gray-400",
              isCollapsed ? "mx-auto" : "mr-3"
            )} />
            {!isCollapsed && (
              <span className="text-sm text-gray-700">About SAMI</span>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
} 