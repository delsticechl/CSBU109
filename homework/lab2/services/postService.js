const BASE_URL = 'https://dummyjson.com';

export const postService = {
  async getPosts(limit = 10, skip = 0) {
    const res = await fetch(`${BASE_URL}/posts?limit=${limit}&skip=${skip}`);
    if (!res.ok) throw new Error('Failed to fetch posts');
    return res.json(); // returns { posts, total, skip, limit }
  },

  async searchPosts(query) {
    const res = await fetch(`${BASE_URL}/posts/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search posts');
    return res.json();
  },

  async getPostComments(postId) {
    const res = await fetch(`${BASE_URL}/posts/${postId}/comments`);
    if (!res.ok) throw new Error('Failed to fetch comments');
    return res.json(); // returns { comments: [...] }
  },

  async createPost(postData) {
    const res = await fetch(`${BASE_URL}/posts/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData),
    });
    if (!res.ok) throw new Error('Failed to create post');
    return res.json();
  },

  async deletePost(postId) {
    const res = await fetch(`${BASE_URL}/posts/${postId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete post');
    return res.json();
  }
};
