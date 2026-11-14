/** Shapes of the data typed into the UI forms. Shared by page objects, common steps and test data builders. */

/** The three customer fields of the booking form. */
export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
}

/** The fields of the admin "New Event" form. */
export interface EventFormData {
  title: string;
  description?: string;
  category: 'Conference' | 'Concert' | 'Sports' | 'Workshop' | 'Festival';
  city: string;
  venue: string;
  /** Local date & time in the input's format: 'YYYY-MM-DDTHH:mm' */
  dateTime: string;
  price: number;
  totalSeats: number;
  imageUrl?: string;
}
