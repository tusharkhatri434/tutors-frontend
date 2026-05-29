import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './ui/Card';
import { formatDate } from '../utils/helpers';

interface BlogCardProps {
  blog: {
    title: string;
    slug: string;
    excerpt: string;
    thumbnail?: string;
    author: { name: string };
    publishedAt: string;
    category?: string;
  };
}

export const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      {blog.thumbnail && (
        <div className="w-full h-48 overflow-hidden">
          <img
            src={blog.thumbnail}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="p-6 flex flex-col flex-grow">
        {blog.category && (
          <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-2 block">
            {blog.category}
          </span>
        )}
        <Link to={`/blogs/${blog.slug}`} className="block mt-2">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 hover:text-primary transition-colors">
            {blog.title}
          </h3>
        </Link>
        <p className="text-slate-600 dark:text-slate-300 mb-4 line-clamp-3 flex-grow">
          {blog.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
          <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            By {blog.author.name}
          </span>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {blog.publishedAt ? formatDate(blog.publishedAt) : 'Draft'}
          </span>
        </div>
      </div>
    </Card>
  );
};
