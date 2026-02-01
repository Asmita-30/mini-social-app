import React, { useEffect, useState, useContext } from "react";
import axios from "../api/axios";
import { AuthContext } from "../context/AuthContext";
// import CreatePost from "../components/CreatePost";
// import PostCard from "../components/PostCard";
import "./Feed.css";

const Feed = () => {
  const { user, logout } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get("/posts");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  return (
    <div className="feed-page">
      <nav className="feed-navbar">
        <h2>Mini Social</h2>
        <div>
          <span>Hi, {user?.username}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </nav>

      <CreatePost refreshPosts={fetchPosts} />

      <div className="posts-container">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} refreshPosts={fetchPosts} />
        ))}
      </div>
    </div>
  );
};

export default Feed;
