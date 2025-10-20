import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Send } from "lucide-react";

interface CreatePostProps {
  onPostCreated: () => void;
}

export const CreatePost = ({ onPostCreated }: CreatePostProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase
      .from("posts")
      .insert([{ content: content.trim(), user_id: user.id }]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error creating post",
        description: error.message,
      });
    } else {
      setContent("");
      toast({
        title: "Post created!",
        description: "Your post has been shared.",
      });
      onPostCreated();
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-soft">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {content.length}/500
            </span>
            <Button type="submit" disabled={loading || !content.trim()}>
              <Send className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
