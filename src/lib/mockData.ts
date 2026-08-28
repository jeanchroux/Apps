import { addDays } from "date-fns";
import type { City, EventWithVenue, Ticket, Trip, Venue } from "@/types/database.types";

/**
 * Local fixture data so the app is fully browsable before Supabase is wired
 * up (no env vars set) or while offline. Hooks in src/hooks fall back to
 * this automatically — see isSupabaseConfigured in src/lib/supabase.ts.
 */

export const mockCities: City[] = [
  { id: "city-dc", name: "Washington DC", country: "USA", timezone: "America/New_York", lat: 38.9, lng: -77.0, is_default: true, created_at: "" },
  { id: "city-nyc", name: "New York City", country: "USA", timezone: "America/New_York", lat: 40.7, lng: -74.0, is_default: true, created_at: "" },
  { id: "city-london", name: "London", country: "UK", timezone: "Europe/London", lat: 51.5, lng: -0.1, is_default: true, created_at: "" },
  { id: "city-paris", name: "Paris", country: "France", timezone: "Europe/Paris", lat: 48.9, lng: 2.3, is_default: true, created_at: "" },
  { id: "city-chicago", name: "Chicago", country: "USA", timezone: "America/Chicago", lat: 41.9, lng: -87.6, is_default: true, created_at: "" },
  { id: "city-tokyo", name: "Tokyo", country: "Japan", timezone: "Asia/Tokyo", lat: 35.7, lng: 139.7, is_default: true, created_at: "" },
  { id: "city-seoul", name: "Seoul", country: "South Korea", timezone: "Asia/Seoul", lat: 37.6, lng: 127.0, is_default: true, created_at: "" }
];

export const mockVenues: Venue[] = [
  { id: "venue-kennedy", city_id: "city-dc", name: "The Kennedy Center", category: "concert_hall", address: "2700 F St NW, Washington, DC", lat: null, lng: null, website_url: "https://kennedy-center.org", image_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200", description: "The national performing arts center, on the Potomac.", source: "manual", external_id: null, is_active_default: true, created_at: "", updated_at: "" },
  { id: "venue-arena", city_id: "city-dc", name: "Arena Stage", category: "theater", address: "1101 6th St SW, Washington, DC", lat: null, lng: null, website_url: null, image_url: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=1200", description: "A leading American theater on the Southwest waterfront.", source: "manual", external_id: null, is_active_default: true, created_at: "", updated_at: "" },
  { id: "venue-met", city_id: "city-nyc", name: "Metropolitan Opera", category: "opera_house", address: "Lincoln Center, New York, NY", lat: null, lng: null, website_url: "https://metopera.org", image_url: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200", description: "The grandest stage in American opera.", source: "manual", external_id: null, is_active_default: true, created_at: "", updated_at: "" },
  { id: "venue-carnegie", city_id: "city-nyc", name: "Carnegie Hall", category: "concert_hall", address: "881 7th Ave, New York, NY", lat: null, lng: null, website_url: null, image_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200", description: "Legendary acoustics, since 1891.", source: "manual", external_id: null, is_active_default: true, created_at: "", updated_at: "" },
  { id: "venue-royal-opera", city_id: "city-london", name: "Royal Opera House", category: "opera_house", address: "Bow St, London", lat: null, lng: null, website_url: null, image_url: "https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=1200", description: "Covent Garden's opera and ballet home.", source: "manual", external_id: null, is_active_default: true, created_at: "", updated_at: "" },
  { id: "venue-garnier", city_id: "city-paris", name: "Opéra Garnier", category: "opera_house", address: "Place de l'Opéra, Paris", lat: null, lng: null, website_url: null, image_url: "https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=1200", description: "Belle Époque splendor in the 9th arrondissement.", source: "manual", external_id: null, is_active_default: true, created_at: "", updated_at: "" },
  { id: "venue-lyric", city_id: "city-chicago", name: "Lyric Opera of Chicago", category: "opera_house", address: "20 N Wacker Dr, Chicago, IL", lat: null, lng: null, website_url: null, image_url: "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=1200", description: "One of the largest opera companies in North America.", source: "manual", external_id: null, is_active_default: true, created_at: "", updated_at: "" }
];

const summary = (s: string) => s;

export const mockEvents: EventWithVenue[] = [
  {
    id: "evt-1",
    venue_id: "venue-kennedy",
    title: "Washington National Opera: Madama Butterfly",
    category: "opera",
    description: null,
    ai_summary: summary("Puccini's tragic romance returns in a lush, traditional staging — a moving, accessible entry point if you've never seen opera live."),
    start_at: addDays(new Date(), 12).toISOString(),
    end_at: null,
    poster_image_url: "https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=1200",
    ticket_url: "https://kennedy-center.org",
    price_min: 79,
    price_max: 320,
    currency: "USD",
    quality_score: 91,
    press_reviews: [{ source: "Washington Post", quote: "Devastatingly beautiful.", sentiment: "positive" }],
    is_lgbtq_friendly: false,
    lgbtq_tags: [],
    curation_notes: null,
    source: "ai_curated",
    external_id: null,
    created_at: "",
    updated_at: "",
    venue: mockVenues[0]
  },
  {
    id: "evt-2",
    venue_id: "venue-met",
    title: "The Met: Champion (Terence Blanchard)",
    category: "opera",
    description: null,
    ai_summary: summary("A jazz-infused new opera on the life of boxer Emile Griffith, exploring identity and sexuality with raw power. Widely celebrated for its queer storytelling."),
    start_at: addDays(new Date(), 25).toISOString(),
    end_at: null,
    poster_image_url: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=1200",
    ticket_url: "https://metopera.org",
    price_min: 55,
    price_max: 275,
    currency: "USD",
    quality_score: 96,
    press_reviews: [{ source: "New York Times", quote: "A landmark work.", sentiment: "positive" }],
    is_lgbtq_friendly: true,
    lgbtq_tags: ["queer-storyline", "pride-programming"],
    curation_notes: null,
    source: "ai_curated",
    external_id: null,
    created_at: "",
    updated_at: "",
    venue: mockVenues[2]
  },
  {
    id: "evt-3",
    venue_id: "venue-carnegie",
    title: "Yannick Nézet-Séguin conducts Mahler's 5th",
    category: "classical",
    description: null,
    ai_summary: summary("A titanic, emotionally sweeping symphony under one of the era's most electric conductors — expect a standing ovation."),
    start_at: addDays(new Date(), 40).toISOString(),
    end_at: null,
    poster_image_url: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=1200",
    ticket_url: null,
    price_min: 45,
    price_max: 210,
    currency: "USD",
    quality_score: 88,
    press_reviews: [],
    is_lgbtq_friendly: false,
    lgbtq_tags: [],
    curation_notes: null,
    source: "ticketmaster",
    external_id: null,
    created_at: "",
    updated_at: "",
    venue: mockVenues[3]
  },
  {
    id: "evt-4",
    venue_id: "venue-royal-opera",
    title: "Royal Ballet: Swan Lake",
    category: "dance",
    description: null,
    ai_summary: summary("The definitive Petipa/Ivanov staging, danced with exquisite precision — a bucket-list classic in one of the world's great houses."),
    start_at: addDays(new Date(), 60).toISOString(),
    end_at: null,
    poster_image_url: "https://images.unsplash.com/photo-1580809361436-42a7ec204889?w=1200",
    ticket_url: null,
    price_min: 35,
    price_max: 180,
    currency: "GBP",
    quality_score: 93,
    press_reviews: [],
    is_lgbtq_friendly: false,
    lgbtq_tags: [],
    curation_notes: null,
    source: "ai_curated",
    external_id: null,
    created_at: "",
    updated_at: "",
    venue: mockVenues[4]
  }
];

export const mockTrips: Trip[] = [
  {
    id: "trip-1",
    user_id: "demo-user",
    destination_city_id: "city-london",
    label: "Anniversary trip",
    start_date: addDays(new Date(), 58).toISOString().slice(0, 10),
    end_date: addDays(new Date(), 65).toISOString().slice(0, 10),
    created_at: ""
  }
];

export const mockTickets: Ticket[] = [
  {
    id: "ticket-1",
    user_id: "demo-user",
    event_id: "evt-1",
    event_name: "Washington National Opera: Madama Butterfly",
    venue_name: "The Kennedy Center",
    event_date: addDays(new Date(), 12).toISOString().slice(0, 10),
    event_time: "19:30",
    num_tickets: 2,
    notes: "Orchestra seats, aisle if possible.",
    source: "manual",
    calendar_event_id: null,
    created_at: "",
    updated_at: ""
  }
];
