/**
 * Hand-authored types mirroring supabase/migrations/0001_init.sql.
 * In production, regenerate with:
 *   npm run supabase:types
 * (requires the Supabase CLI + SUPABASE_PROJECT_ID env var)
 */

export type VenueCategory =
  | "concert_hall"
  | "opera_house"
  | "theater"
  | "gallery"
  | "museum"
  | "jazz_club"
  | "dance"
  | "other";

export type EventCategory =
  | "classical"
  | "opera"
  | "theater"
  | "dance"
  | "jazz"
  | "contemporary_music"
  | "visual_art"
  | "film"
  | "other";

export type DataSource = "manual" | "ticketmaster" | "seatgeek" | "venue_scrape" | "ai_curated";
export type TicketSource = "manual" | "synced";

export interface City {
  id: string;
  name: string;
  country: string;
  timezone: string;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  created_at: string;
}

export interface Venue {
  id: string;
  city_id: string;
  name: string;
  category: VenueCategory;
  address: string | null;
  lat: number | null;
  lng: number | null;
  website_url: string | null;
  image_url: string | null;
  description: string | null;
  source: DataSource;
  external_id: string | null;
  is_active_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface VenueWithPreference extends Venue {
  is_enabled_for_user: boolean;
}

export interface PressReview {
  source: string;
  quote: string;
  url?: string;
  sentiment: "positive" | "mixed" | "negative";
}

export interface CulturalEvent {
  id: string;
  venue_id: string;
  title: string;
  category: EventCategory;
  description: string | null;
  ai_summary: string | null;
  start_at: string;
  end_at: string | null;
  poster_image_url: string | null;
  ticket_url: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  quality_score: number | null;
  press_reviews: PressReview[];
  is_lgbtq_friendly: boolean;
  lgbtq_tags: string[];
  curation_notes: string | null;
  source: DataSource;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventWithVenue extends CulturalEvent {
  venue: Venue;
}

export interface Trip {
  id: string;
  user_id: string;
  destination_city_id: string;
  label: string | null;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  event_id: string | null;
  event_name: string;
  venue_name: string;
  event_date: string;
  event_time: string | null;
  num_tickets: number;
  notes: string | null;
  source: TicketSource;
  calendar_event_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlertSubscription {
  id: string;
  user_id: string;
  city_id: string;
  min_quality_score: number;
  lgbtq_only: boolean;
  category: EventCategory | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  instagram_handle: string | null;
  home_city_id: string | null;
  theme_preference: "system" | "light" | "dark";
  created_at: string;
  updated_at: string;
}
