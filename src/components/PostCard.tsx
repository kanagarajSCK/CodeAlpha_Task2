import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { CommentSection } from "./CommentSection";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export const PostCard = ({ post, onDelete }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [post.id]);

  const fetchLikes = async () => {
    const { data: likes } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", post.id);

    setLikesCount(likes?.length || 0);
    if (user) {
      setLiked(likes?.some((like) => like.user_id === user.id) || false);
    }
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("id")
      .eq("post_id", post.id);
    setCommentsCount(data?.length || 0);
  };

  const handleLike = async () => {
    if (!user) return;

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("likes")
        .insert([{ post_id: post.id, user_id: user.id }]);
    }
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting post",
        description: error.message,
      });
    } else {
      toast({ title: "Post deleted" });
      onDelete?.();
    }
  };

  return (
    <Card className="shadow-soft hover:shadow-hover transition-smooth animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate(`/profile/${post.user_id}`)}
          >
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                {post.profiles?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{post.profiles?.full_name || post.profiles?.username}</p>
              <p className="text-sm text-muted-foreground">
                @{post.profiles?.username} · {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          {user?.id === post.user_id && (
            <Button variant="ghost" size="icon" onClick={handleDelete}>
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
        <div className="flex gap-6 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={liked ? "text-destructive hover:text-destructive" : ""}
          >
            <Heart className={`w-5 h-5 mr-2 ${liked ? "fill-current" : ""}`} />
            {likesCount}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {commentsCount}
          </Button>
        </div>
        {showComments && (
          <CommentSection 
            postId={post.id} 
            onCommentAdded={fetchComments}
          />
        )}
      </CardContent>
    </Card>
  );
};
