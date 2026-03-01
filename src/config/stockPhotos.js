import { INCLUDED_TYPES } from './wellnessCategories';

// Stock photos for different wellness types (multiple options per type)
export const STOCK_PHOTOS = {
  spa: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Spa interior
    "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=450&fit=crop", // Spa treatment room
    "https://calista.com.tr/media/532bmoz2/spa-nedir.jpg?rmode=max&width=500&height=265", // Spa with stones
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=450&fit=crop", // Modern spa
  ],
  pilates: [
    "https://www.gymshark.com/_next/image?url=https%3A%2F%2Fimages.ctfassets.net%2F8urtyqugdt2l%2F72aT9RfcJ0w20zXQDMDd1t%2F2e55e3e37c035ba44bd795c777f11f85%2FWhat_is_pilates_desktop.jpg&w=3840&q=85",
    "https://images.ctfassets.net/ipjoepkmtnha/5nTW9GvNYKtjJukcotDgji/c9cffb3fb04dfe4e7407153f371054dd/TG_REFORM_TechnoGym_Classe_-_12_1198_ADV__1_.jpg?w=2560&fm=webp&q=75"
  ],
  gym: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=450&fit=crop", // Gym equipment
    "https://linkspaces.co.uk/wp-content/uploads/2024/05/gb-botanica-gym-link-spaces-slough.jpg", // Fitness center
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=450&fit=crop", // Workout area
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=450&fit=crop", // Modern gym
  ],
  chiropractor: [
    "https://www.uhhospitals.org/-/media/images/blog/2025/06/chiropractic-treament-back-male-1962457513-blog-mainarticleimage.jpg?h=450&w=720&la=en&hash=FE42B5CA76E31231B15FD808C8E42D3F", // Chiropractic office
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=450&fit=crop", // Medical office
    "https://storage.googleapis.com/treatspace-prod-media/pracimg/u-70/shutterstock_1793070016.jpeg", // Healthcare facility
  ],
  massage: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Massage/spa
    "https://www.health.com/thmb/fjqlqzad3uXf4wWE7paYmsNdzO4=/750x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/GettyImages-1357320952-2e3559dea93846838330e1b548d5f196.jpg",
    "https://resources.healthydirections.com/resources/web/articles/hd/hd-benefits-of-a-massage-cover.jpg"
  ],
  sauna: [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Sauna
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=450&fit=crop", // Steam room
    "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&h=450&fit=crop", // Relaxation space
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=450&fit=crop", // Wellness facility
  ],
  yoga: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop", // Yoga studio
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop", // Meditation space
    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop", // Peaceful studio
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=450&fit=crop", // Yoga room
  ],
  acupuncture: [
    "https://spinehealth.org/wp-content/uploads/2023/01/iStock-1356338837.jpg",
    "https://mindbodyspiritcare.com/wp-content/uploads/2021/04/127965830_s.jpg"
  ],
  default: [
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop", // Default wellness
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop", // Healthcare
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop", // Wellness
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Relaxation
  ]
};

// Return the ordered list of candidate photos for a provider's categories.
// Falls back to default if no category match.
const getCandidatePhotos = (categories = []) => {
  for (const type of INCLUDED_TYPES) {
    if (categories.includes(type)) {
      const arr = STOCK_PHOTOS[type];
      if (arr && arr.length > 0) return arr;
    }
  }
  return STOCK_PHOTOS.default;
};

// Assign stock photos to a page of providers, minimizing URL reuse.
// Providers with hasRealImage=true keep their existing image.
// For the rest, we greedily pick the first candidate URL not yet used on this page.
// If the category pool is exhausted we fall back to other category photos, then
// repeat (accepting a duplicate) only as a last resort.
export const assignPhotosForPage = (providers) => {
  const usedUrls = new Set();

  // Reserve URLs already occupied by real images so stock picks avoid them too.
  providers.forEach((p) => {
    if (p.hasRealImage && p.image) usedUrls.add(p.image);
  });

  // All stock photos flattened, deduplicated, as a global fallback pool.
  const allStockPhotos = [...new Set(Object.values(STOCK_PHOTOS).flat())];

  return providers.map((provider) => {
    if (provider.hasRealImage) return provider;

    const candidates = getCandidatePhotos(provider.categories);

    // 1st choice: unused photo from this category
    let photo = candidates.find((url) => !usedUrls.has(url));

    // 2nd choice: any unused stock photo from any category
    if (!photo) {
      photo = allStockPhotos.find((url) => !usedUrls.has(url));
    }

    // Last resort: just use first candidate (accept duplicate)
    if (!photo) photo = candidates[0];

    usedUrls.add(photo);
    return { ...provider, image: photo };
  });
};
