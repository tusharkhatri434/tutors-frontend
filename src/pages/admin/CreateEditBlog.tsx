import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import api from '../../services/api';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Loader } from '../../components/ui/Loader';

const blogSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  excerpt: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.string().optional(),
  isPublished: z.boolean().optional(),
});

type BlogFormValues = z.infer<typeof blogSchema>;

export const CreateEditBlog: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const quillRef = useRef<any>(null);
  
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [readingTime, setReadingTime] = useState(0);
  
  const isEditMode = !!id;

  // Optimized Fetch by ID
  const { data: blog, isLoading: isLoadingBlog } = useQuery({
    queryKey: ['blogEdit', id],
    queryFn: async () => {
      const { data } = await api.get(`/blogs/${id}`);
      if (data) {
        setThumbnailUrl(data.thumbnail || '');
        return data;
      }
      throw new Error('Blog not found');
    },
    enabled: isEditMode,
  });

  const { register, handleSubmit, control, reset, watch, formState: { errors } } = useForm<BlogFormValues>({
    resolver: zodResolver(blogSchema),
    defaultValues: {
      isPublished: false,
      content: '',
    }
  });

  // Calculate statistics from rich content
  const calculateStats = (htmlContent: string) => {
    if (!htmlContent) {
      setWordCount(0);
      setReadingTime(0);
      return;
    }
    // Strip HTML tags to get pure text content
    const text = htmlContent.replace(/<[^>]*>/g, ' ');
    // Split by whitespace and remove empty strings
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const count = words.length;
    setWordCount(count);
    
    // Average reading speed: 200 words per minute
    const time = Math.max(1, Math.ceil(count / 200));
    setReadingTime(count > 0 ? time : 0);
  };

  const contentValue = watch('content');
  useEffect(() => {
    calculateStats(contentValue || '');
  }, [contentValue]);

  useEffect(() => {
    if (blog) {
      reset({
        title: blog.title,
        excerpt: blog.excerpt || '',
        content: blog.content,
        category: blog.category || '',
        isPublished: blog.isPublished || false,
      });
    }
  }, [blog, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditMode) {
        await api.put(`/blogs/${id}`, data);
      } else {
        await api.post('/blogs', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBlogs'] });
      navigate('/admin/blogs');
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setUploadingImage(true);
    try {
      const { data } = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setThumbnailUrl(data.url);
    } catch (error) {
      console.error('Image upload failed', error);
      alert('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = (data: BlogFormValues) => {
    mutation.mutate({
      ...data,
      thumbnail: thumbnailUrl,
    });
  };

  // Custom Quill Toolbar configurations with Tables, Sections, Code, etc.
  const modules = useMemo(() => ({
    toolbar: {
      container: '#custom-editor-toolbar',
      handlers: {
        // Custom image upload override for the toolbar button
        image: () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files?.[0];
            if (file && quillRef.current) {
              const quill = quillRef.current.getEditor();
              const formData = new FormData();
              formData.append('image', file);
              try {
                const { data } = await api.post('/upload', formData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', data.url);
                quill.setSelection(range.index + 1);
              } catch (error) {
                console.error('Failed to upload image:', error);
                alert('Failed to upload image');
              }
            }
          };
        }
      }
    },
    keyboard: {
      bindings: {
        // Exits code block on Enter key on an empty line
        exitCodeBlock: {
          key: 'Enter',
          empty: true,
          format: ['code-block'],
          handler: function (range: any, context: any) {
            if (quillRef.current) {
              const quill = quillRef.current.getEditor();
              // Remove the code-block format from the current empty line
              quill.formatLine(range.index, 1, 'code-block', false);
              // Shift focus/cursor back to the normal paragraph line
              quill.setSelection(range.index + 1);
              return false; // Stop further processing
            }
            return true;
          }
        }
      }
    },
    table: true
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background', 'align',
    'table'
  ];

  // Intercept Paste & Drag-Drop events inside the Quill editor instance
  const setupImageHandlers = (quill: any) => {
    if (!quill || quill.root.__handlersAttached) return;
    quill.root.__handlersAttached = true;

    const uploadFile = async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      try {
        const { data } = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data.url;
      } catch (error) {
        console.error('Failed to upload image:', error);
        return null;
      }
    };

    const insertImage = (url: string) => {
      const range = quill.getSelection(true);
      quill.insertEmbed(range.index, 'image', url);
      quill.setSelection(range.index + 1);
    };

    // Paste handler
    quill.root.addEventListener('paste', async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const url = await uploadFile(file);
            if (url) insertImage(url);
          }
        }
      }
    });

    // Drag and Drop handler
    quill.root.addEventListener('drop', async (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files || files.length === 0) return;

      let hasImage = false;
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.indexOf('image') !== -1) {
          hasImage = true;
        }
      }

      if (hasImage) {
        e.preventDefault();
        for (let i = 0; i < files.length; i++) {
          if (files[i].type.indexOf('image') !== -1) {
            const url = await uploadFile(files[i]);
            if (url) insertImage(url);
          }
        }
      }
    });
  };

  if (isEditMode && isLoadingBlog) return <Loader />;

  return (
    <div className="notion-theme-light min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {isEditMode ? 'Edit Article' : 'Create New Article'}
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Write, design, and organize your content with our Notion-style editor experience.
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/blogs')}>
              Discard
            </Button>
            <Button type="submit" form="blog-form" isLoading={mutation.isPending}>
              {isEditMode ? 'Publish Updates' : 'Publish Article'}
            </Button>
          </div>
        </div>

        {mutation.isError && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg text-sm border border-red-100 dark:border-red-900/50 shadow-sm">
            {/* @ts-ignore */}
            Error: {mutation.error?.response?.data?.message || mutation.error?.message || 'Something went wrong while saving'}
          </div>
        )}

        <form id="blog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-24">
          {/* Canvas Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-visible transition-all duration-300">
            <div className="p-6 sm:p-8 space-y-6">
              
              {/* Title & Category Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Title"
                    placeholder="e.g., Understanding Modern Design Patterns"
                    {...register('title')}
                    error={errors.title?.message}
                  />
                </div>
                <div>
                  <Input
                    label="Category"
                    placeholder="e.g., Tech, Life, Business"
                    {...register('category')}
                    error={errors.category?.message}
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Short Excerpt
                </label>
                <textarea
                  placeholder="Give a brief summary of the article..."
                  {...register('excerpt')}
                  className="block w-full rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-4 py-3 dark:bg-slate-900 dark:text-white transition-all duration-200"
                  rows={2}
                />
              </div>

              {/* Thumbnail Header Area */}
              <div className="relative group border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 transition-all duration-300 hover:border-blue-500">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Cover Thumbnail Image</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Drag & drop or click to upload cover picture</p>
                  </div>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Button type="button" variant="outline" className="relative pointer-events-none">
                      Select File
                    </Button>
                  </div>
                </div>
                
                {uploadingImage && (
                  <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center rounded-xl">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400 animate-pulse">Uploading cover...</span>
                  </div>
                )}

                {thumbnailUrl && (
                  <div className="mt-6 relative w-full h-64 rounded-xl overflow-hidden shadow-md group-hover:shadow-lg transition-shadow duration-300">
                    <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setThumbnailUrl('')}
                      className="absolute top-3 right-3 bg-red-600 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-red-700"
                      title="Remove Thumbnail"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* NOTION/MEDIUM EDITOR CANVAS */}
              <div className="relative space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Article Body (Notion-style Editor)
                  </label>
                  <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center space-x-2">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Supports Drag & Drop / Copy-Paste Images</span>
                  </div>
                </div>

                {/* Modern Custom Sticky Toolbar */}
                <div className="sticky top-0 z-20 shadow-sm border border-slate-200 dark:border-slate-800 rounded-xl overflow-visible bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
                  <div id="custom-editor-toolbar" className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 dark:border-slate-800">
                    <span className="ql-formats">
                      <select className="ql-header" defaultValue="">
                        <option value="1">Heading 1</option>
                        <option value="2">Heading 2</option>
                        <option value="3">Heading 3</option>
                        <option value="">Normal Text</option>
                      </select>
                    </span>
                    <span className="ql-formats">
                      <button className="ql-bold" title="Bold" />
                      <button className="ql-italic" title="Italic" />
                      <button className="ql-underline" title="Underline" />
                      <button className="ql-strike" title="Strike" />
                    </span>
                    <span className="ql-formats">
                      <button className="ql-blockquote" title="Quote" />
                      <button className="ql-code-block" title="Code Block" />
                    </span>
                    <span className="ql-formats">
                      <button className="ql-list" value="ordered" title="Ordered List" />
                      <button className="ql-list" value="bullet" title="Bullet List" />
                    </span>
                    <span className="ql-formats">
                      <button className="ql-table" title="Insert Table" />
                    </span>
                    <span className="ql-formats">
                      <button className="ql-link" title="Insert Link" />
                      <button className="ql-image" title="Insert Image" />
                      <button className="ql-video" title="Insert Video" />
                    </span>
                    <span className="ql-formats">
                      <select className="ql-color" title="Text Color" />
                      <select className="ql-background" title="Text Highlight" />
                    </span>
                    <span className="ql-formats">
                      <button className="ql-clean" title="Clear Formatting" />
                    </span>
                  </div>
                </div>

                {/* Editor Workspace */}
                <div className="notion-editor-container border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner">
                  <Controller
                    name="content"
                    control={control}
                    render={({ field }) => (
                      <ReactQuill 
                        ref={(el) => {
                          quillRef.current = el;
                          if (el) {
                            const quill = el.getEditor();
                            setupImageHandlers(quill);
                          }
                        }}
                        theme="snow"
                        modules={modules}
                        formats={formats}
                        placeholder="Start writing your story... Type headings, add tables, drop files, paste images..."
                        value={field.value || ''} 
                        onChange={field.onChange}
                      />
                    )}
                  />
                </div>
                {errors.content && (
                  <p className="text-xs text-red-500 font-medium mt-1">{errors.content.message}</p>
                )}
              </div>

              {/* Immediately Publish Checkbox */}
              <div className="flex items-center p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-850">
                <input
                  type="checkbox"
                  id="isPublished"
                  {...register('isPublished')}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-800 rounded transition-colors cursor-pointer"
                />
                <label htmlFor="isPublished" className="ml-3 text-sm font-medium text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                  Publish this article immediately to public feed
                </label>
              </div>

            </div>
          </div>

          {/* Floating Editor Status Dashboard at bottom */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-full border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center space-x-6 z-40 max-w-sm sm:max-w-md transition-all duration-300">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Words:</span>
              <span className="text-sm font-bold text-slate-850 dark:text-slate-100">{wordCount}</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">Reading Time:</span>
              <span className="text-sm font-bold text-slate-850 dark:text-slate-100">{readingTime} min</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
            <div className="flex items-center space-x-2">
              <div className={`w-2.5 h-2.5 rounded-full ${mutation.isPending ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`} />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                {mutation.isPending ? 'Saving...' : 'Draft Saved'}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
