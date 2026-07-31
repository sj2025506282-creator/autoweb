export interface PlaceLead {
  placeId: string
  name: string
  address: string
  phone: string
  website: string
  googleMapsUrl: string
  lat: number
  lng: number
  rating: number | null
  reviewCount: number
  businessStatus: string
  hasWebsite: boolean
}

interface GooglePlace {
  id?: string
  displayName?: { text?: string }
  formattedAddress?: string
  nationalPhoneNumber?: string
  internationalPhoneNumber?: string
  websiteUri?: string
  googleMapsUri?: string
  location?: { latitude?: number; longitude?: number }
  rating?: number
  userRatingCount?: number
  businessStatus?: string
}

interface GooglePlacesResponse {
  places?: GooglePlace[]
  error?: { message?: string; status?: string }
}

function validWebsite(value?: string): string {
  if (!value) return ''
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : ''
  } catch {
    return ''
  }
}

export class PlacesSearchError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message)
    this.name = 'PlacesSearchError'
  }
}

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
].join(',')

export async function searchRestaurantLeads(
  apiKey: string,
  query: string,
  pageSize: number,
): Promise<PlaceLead[]> {
  if (!apiKey) {
    throw new PlacesSearchError(
      'Google Places is not configured. Add GOOGLE_PLACES_API_KEY to the API Worker environment.',
      503,
    )
  }

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      includedType: 'restaurant',
      strictTypeFiltering: true,
      pageSize,
      rankPreference: 'RELEVANCE',
    }),
  })

  const payload = await response.json() as GooglePlacesResponse
  if (!response.ok) {
    throw new PlacesSearchError(
      payload.error?.message || 'Google Places search failed.',
      response.status >= 400 && response.status < 500 ? 400 : 502,
    )
  }

  return (payload.places || [])
    .filter((place) => place.id && place.displayName?.text)
    .map((place) => {
      const website = validWebsite(place.websiteUri)
      return {
        placeId: place.id!,
        name: place.displayName!.text!,
        address: place.formattedAddress || '',
        phone: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
        website,
        googleMapsUrl: place.googleMapsUri || '',
        lat: place.location?.latitude || 0,
        lng: place.location?.longitude || 0,
        rating: typeof place.rating === 'number' ? place.rating : null,
        reviewCount: place.userRatingCount || 0,
        businessStatus: place.businessStatus || '',
        hasWebsite: Boolean(website),
      }
    })
}
