/** Shapes of the EventHub REST API (request bodies and the parts of the responses the tests use). */
export type EventCategory = 'Conference' | 'Concert' | 'Sports' | 'Workshop' | 'Festival';

export interface ApiEvent {
  id: number;
  title: string;
  category: string;
  city: string;
  venue: string;
  eventDate: string;
  /** Exact price as stored by the backend, e.g. "49.99" (the UI shows it rounded). */
  price: string;
  totalSeats: number;
  availableSeats: number;
  isStatic: boolean;
  userId: number | null;
  /** ISO timestamp set by the backend. */
  createdAt: string;
}

export interface ApiBooking {
  id: number;
  bookingRef: string;
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
  /** Exact total as stored by the backend, e.g. "149.97". */
  totalPrice: string;
  status: 'confirmed' | 'cancelled';
  /** GET /bookings embeds the full event of each booking. */
  event: ApiEvent;
  /** ISO timestamp set by the backend. */
  createdAt: string;
}

/** Body of POST /bookings (see CreateBookingInput in the API docs). */
export interface CreateBookingInput {
  eventId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  quantity: number;
}

/** Body of POST /events (see CreateEventInput in the API docs). */
export interface CreateEventInput {
  title: string;
  description?: string;
  category: EventCategory;
  venue: string;
  city: string;
  /** ISO 8601 date-time, e.g. "2026-06-15T09:00:00.000Z". */
  eventDate: string;
  price: number;
  totalSeats: number;
  imageUrl?: string;
}
