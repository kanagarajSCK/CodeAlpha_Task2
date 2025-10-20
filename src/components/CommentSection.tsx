import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { Trash2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    avatar_url: string;
  };
}

interface CommentSectionProps {
  postId: string;
  onCommentAdded: () => void;
}

export const CommentSection = ({ postId, onCommentAdded }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        profiles(username, avatar_url)
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    setComments(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    const { error } = await supabase
      .from("comments")
      .insert([{ post_id: postId, user_id: user.id, content: newComment.trim() }]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error posting comment",
        description: error.message,
      });
    } else {
      setNewComment("");
      fetchComments();
      onCommentAdded();
    }
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error deleting comment",
        description: error.message,
      });
    } else {
      fetchComments();
      onCommentAdded();
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          maxLength={200}
        />
        <Button type="submit" size="sm">Post</Button>
      </form>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 items-start">
            <Avatar className="w-8 h-8">
              <AvatarImage src={comment.profiles?.avatar_url} />
              <AvatarFallback className="text-xs">
                {comment.profiles?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 bg-secondary rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold">@{comment.profiles?.username}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </p>
                  {user?.id === comment.user_id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
