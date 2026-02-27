// Stock photos for different wellness types (multiple options per type)
export const STOCK_PHOTOS = {
  spa: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Spa interior
    "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=800&h=450&fit=crop", // Spa treatment room
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Spa with stones
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=450&fit=crop", // Modern spa
  ],
  gym: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=450&fit=crop", // Gym equipment
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Fitness center
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=450&fit=crop", // Workout area
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=450&fit=crop", // Modern gym
  ],
  chiropractor: [
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop", // Chiropractic office
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&h=450&fit=crop", // Medical office
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop", // Healthcare facility
    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop", // Medical consultation room
  ],
  beauty_salon: [
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=450&fit=crop", // Beauty salon
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=450&fit=crop", // Salon interior
    "https://images.unsplash.com/photo-1622296089863-9a17db4820ce?w=800&h=450&fit=crop", // Beauty treatment room
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=450&fit=crop", // Stylish salon
  ],
  hair_care: [
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&h=450&fit=crop", // Hair salon
    "https://images.unsplash.com/photo-1521590832167-7bcbf0ab8868?w=800&h=450&fit=crop", // Hair styling station
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=450&fit=crop", // Hair salon interior
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=800&h=450&fit=crop", // Hair care facility
  ],
  massage: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Massage/spa
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop", // Massage table
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Therapy room
    "https://images.unsplash.com/photo-1506629905607-0b5ab9a9e21a?w=800&h=450&fit=crop", // Wellness massage
  ],
  sauna: [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=450&fit=crop", // Sauna
    "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&h=450&fit=crop", // Steam room
    "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=800&h=450&fit=crop", // Relaxation space
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=450&fit=crop", // Wellness facility
  ],
  wellness_center: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop", // Wellness center
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop", // Holistic center
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop", // Health center
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop", // Wellness space
  ],
  yoga_studio: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop", // Yoga studio
    "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=450&fit=crop", // Meditation space
    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=450&fit=crop", // Peaceful studio
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&h=450&fit=crop", // Yoga room
  ],
  default: [
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=450&fit=crop", // Default wellness
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=450&fit=crop", // Healthcare
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=450&fit=crop", // Wellness
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&h=450&fit=crop", // Relaxation
  ]
};

// Track used photos to avoid duplicates on the same page
let usedPhotos = new Set();

// Helper function to get a unique photo that hasn't been used yet
const getUniquePhoto = (photoArray) => {
  // Filter out already used photos
  const availablePhotos = photoArray.filter(photo => !usedPhotos.has(photo));

  // If no available photos, reset and start over (shouldn't happen with our photo count)
  if (availablePhotos.length === 0) {
    usedPhotos.clear();
    return photoArray[Math.floor(Math.random() * photoArray.length)];
  }

  // Select random available photo
  const selectedPhoto = availablePhotos[Math.floor(Math.random() * availablePhotos.length)];

  // Mark as used
  usedPhotos.add(selectedPhoto);

  return selectedPhoto;
};

// Get stock photo URL based on place type (ensures no duplicates)
export const getStockPhotoForType = (types) => {
  if (!types || types.length === 0) {
    return getUniquePhoto(STOCK_PHOTOS.default);
  }

  // Check for specific types in order of preference
  const typePriority = ['spa', 'yoga_studio', 'gym', 'massage', 'wellness_center', 'chiropractor', 'beauty_salon', 'hair_care', 'sauna'];

  for (const priorityType of typePriority) {
    if (types.includes(priorityType)) {
      const photoArray = STOCK_PHOTOS[priorityType];
      if (photoArray && photoArray.length > 0) {
        return getUniquePhoto(photoArray);
      }
    }
  }

  // If no specific match, return default
  return getUniquePhoto(STOCK_PHOTOS.default);
};

// Reset used photos (call when loading new data)
export const resetUsedPhotos = () => {
  usedPhotos.clear();
};
