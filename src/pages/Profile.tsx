import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus } from "lucide-react";

export const Profile = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchProfile();
      fetchPosts();
      fetchFollowStats();
    }
  }, [userId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    setProfile(data);

    if (user && userId !== user.id) {
      const { data: followData } = await supabase
        .from("followers")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", userId);
      
      setIsFollowing(followData && followData.length > 0);
    }
  };

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        profiles(username, full_name, avatar_url)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setPosts(data || []);
  };

  const fetchFollowStats = async () => {
    const { data: followers } = await supabase
      .from("followers")
      .select("id")
      .eq("following_id", userId);
    
    const { data: following } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", userId);
    
    setFollowersCount(followers?.length || 0);
    setFollowingCount(following?.length || 0);
  };

  const handleFollow = async () => {
    if (!user) return;

    if (isFollowing) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", userId);
      
      toast({ title: "Unfollowed" });
    } else {
      await supabase
        .from("followers")
        .insert([{ follower_id: user.id, following_id: userId }]);
      
      toast({ title: "Following!" });
    }
    
    setIsFollowing(!isFollowing);
    fetchFollowStats();
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-soft mb-8">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-3xl bg-gradient-primary text-primary-foreground">
                  {profile.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                  </div>
                  {user && userId !== user.id && (
                    <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                      {isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {profile.bio && <p className="text-foreground mb-4">{profile.bio}</p>}
                <div className="flex gap-6 text-sm">
                  <div>
                    <span className="font-bold">{followersCount}</span>
                    <span className="text-muted-foreground ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold">{followingCount}</span>
                    <span className="text-muted-foreground ml-1">Following</span>
                  </div>
                  <div>
                    <span className="font-bold">{posts.length}</span>
                    <span className="text-muted-foreground ml-1">Posts</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-xl font-bold">Posts</h2>
          {posts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No posts yet
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
