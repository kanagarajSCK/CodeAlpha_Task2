import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreatePost } from "@/components/CreatePost";
import { PostCard } from "@/components/PostCard";
import { Navbar } from "@/components/Navbar";
import { useNavigate } from "react-router-dom";

export const Feed = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchPosts();
  }, [user, navigate]);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        profiles(username, full_name, avatar_url)
      `)
      .order("created_at", { ascending: false });

    setPosts(data || []);
    setLoading(false);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          <CreatePost onPostCreated={fetchPosts} />
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              Loading posts...
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No posts yet. Be the first to share something!
            </div>
          ) : (
            posts.map((post) => (
              <PostCard key={post.id} post={post} onDelete={fetchPosts} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
