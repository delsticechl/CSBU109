import { useState, useEffect, useCallback } from 'react';
import { postService } from '../services/postService';
import { useDebounce } from './useDebounce';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [total, setTotal] = useState(0);
  const [skip, setSkip] = useState(0);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchPosts = useCallback(async (currentSkip, query) => {
    setLoading(true);
    setError(null);
    try {
      if (query.trim() !== '') {
        const data = await postService.searchPosts(query);
        setPosts(data.posts);
        setTotal(data.total);
      } else {
        const data = await postService.getPosts(limit, currentSkip);
        setPosts(data.posts);
        setTotal(data.total);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchPosts(skip, debouncedSearch);
  }, [skip, debouncedSearch, fetchPosts]);

  const handleAddPost = async (newPostData) => {
    try {
      const created = await postService.createPost({ ...newPostData, userId: 1 });
      setPosts((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setTotal((prev) => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return {
    posts,
    total,
    skip,
    setSkip,
    limit,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    handleAddPost,
    handleDeletePost,
    refetch: () => fetchPosts(skip, debouncedSearch)
  };
}
