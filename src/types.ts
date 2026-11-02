export type Profile = {
  id: string;
  username: string;
};

export type Track = {
  trackId: number;
  title: string;
  artist: string;
  artworkUrl: string;
  trackUrl: string;
  previewUrl: string | null;
};

export type Pick = {
  id: string;
  user_id: string;
  week_start: string;
  itunes_track_id: number;
  title: string;
  artist: string;
  artwork_url: string | null;
  track_url: string | null;
  note: string | null;
  photo_path: string | null;
  created_at: string;
  author: { username: string } | null;
};

export type Rating = {
  user_id: string;
  quality: number;
  emotion: number;
  author: { username: string } | null;
};

export type Comment = {
  id: string;
  user_id: string;
  parent_id: string | null;
  text: string;
  created_at: string;
  author: { username: string } | null;
};
