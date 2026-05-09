// Indian cities mock data for Safe Nav 360X - expanded with multiple cities

export const INDIAN_LOCATIONS = [
  // Delhi
  { id: 1, name: "Connaught Place", city: "Delhi", lat: 28.6315, lng: 77.2167 },
  { id: 2, name: "India Gate", city: "Delhi", lat: 28.6129, lng: 77.2295 },
  { id: 3, name: "Chandni Chowk", city: "Delhi", lat: 28.6507, lng: 77.2334 },
  { id: 4, name: "Hauz Khas Village", city: "Delhi", lat: 28.5494, lng: 77.2001 },
  { id: 5, name: "Sarojini Nagar Market", city: "Delhi", lat: 28.5774, lng: 77.2010 },
  // Mumbai
  { id: 11, name: "Gateway of India", city: "Mumbai", lat: 18.9220, lng: 72.8347 },
  { id: 12, name: "Bandra Kurla Complex", city: "Mumbai", lat: 19.0651, lng: 72.8685 },
  { id: 13, name: "Juhu Beach", city: "Mumbai", lat: 19.0970, lng: 72.8265 },
  { id: 14, name: "Dadar", city: "Mumbai", lat: 19.0178, lng: 72.8478 },
  { id: 15, name: "Andheri", city: "Mumbai", lat: 19.1136, lng: 72.8697 },
  // Bangalore
  { id: 21, name: "MG Road", city: "Bangalore", lat: 12.9757, lng: 77.6011 },
  { id: 22, name: "Indiranagar", city: "Bangalore", lat: 12.9784, lng: 77.6408 },
  { id: 23, name: "Koramangala", city: "Bangalore", lat: 12.9352, lng: 77.6245 },
  { id: 24, name: "Electronic City", city: "Bangalore", lat: 12.8447, lng: 77.6615 },
  // Indore
  { id: 31, name: "Rajwada Palace", city: "Indore", lat: 22.7196, lng: 75.8577 },
  { id: 32, name: "Sarafa Bazaar", city: "Indore", lat: 22.7176, lng: 75.8588 },
  { id: 33, name: "Lal Bagh Palace", city: "Indore", lat: 22.7107, lng: 75.8721 },
  { id: 34, name: "Treasure Island Mall", city: "Indore", lat: 22.7280, lng: 75.8680 },
  { id: 35, name: "IIM Indore", city: "Indore", lat: 22.6775, lng: 75.9273 },
  { id: 36, name: "Vijay Nagar", city: "Indore", lat: 22.7393, lng: 75.8885 },
  { id: 37, name: "Palasia", city: "Indore", lat: 22.7335, lng: 75.8773 },
  { id: 38, name: "AB Road Indore", city: "Indore", lat: 22.7166, lng: 75.8811 },
  // Hyderabad
  { id: 41, name: "Charminar", city: "Hyderabad", lat: 17.3616, lng: 78.4747 },
  { id: 42, name: "HITEC City", city: "Hyderabad", lat: 17.4435, lng: 78.3772 },
  { id: 43, name: "Banjara Hills", city: "Hyderabad", lat: 17.4126, lng: 78.4480 },
  // Pune
  { id: 51, name: "Koregaon Park", city: "Pune", lat: 18.5362, lng: 73.8938 },
  { id: 52, name: "FC Road", city: "Pune", lat: 18.5290, lng: 73.8389 },
  { id: 53, name: "Hinjawadi", city: "Pune", lat: 18.5912, lng: 73.7389 },
  // Chennai
  { id: 61, name: "Marina Beach", city: "Chennai", lat: 13.0499, lng: 80.2824 },
  { id: 62, name: "T. Nagar", city: "Chennai", lat: 13.0418, lng: 80.2341 },
];

export const UNSAFE_ZONES = [
  // Delhi zones
  { id: 1, lat: 28.6450, lng: 77.2200, radius: 300, type: "crime", severity: "high", label: "Crime-prone area", timeRestriction: "night" },
  { id: 2, lat: 28.5550, lng: 77.2100, radius: 200, type: "lighting", severity: "medium", label: "Poor street lighting" },
  { id: 3, lat: 28.6350, lng: 77.2250, radius: 250, type: "crowd", severity: "high", label: "Low crowd density at night", timeRestriction: "night" },
  { id: 4, lat: 28.5700, lng: 77.2350, radius: 180, type: "crime", severity: "medium", label: "Reported incidents" },
  // Indore zones
  { id: 10, lat: 22.7150, lng: 75.8600, radius: 200, type: "crime", severity: "medium", label: "Busy market at night", timeRestriction: "night" },
  { id: 11, lat: 22.7250, lng: 75.8750, radius: 150, type: "lighting", severity: "low", label: "Dim area near colony" },
  // Mumbai zones
  { id: 20, lat: 19.0600, lng: 72.8400, radius: 250, type: "crime", severity: "high", label: "Reported incidents area", timeRestriction: "night" },
  // Bangalore zones
  { id: 30, lat: 12.9600, lng: 77.6000, radius: 200, type: "lighting", severity: "medium", label: "Poorly lit underpass" },
];

export const COMMUNITY_REPORTS = [
  { id: 1, type: "harassment", lat: 28.6400, lng: 77.2180, description: "Eve teasing reported near metro station", time: "2 hours ago", trustScore: 85 },
  { id: 2, type: "unsafe_street", lat: 28.5600, lng: 77.2150, description: "Broken streetlights on main road", time: "5 hours ago", trustScore: 92 },
  { id: 3, type: "suspicious", lat: 28.6300, lng: 77.2280, description: "Suspicious vehicle parked late night", time: "1 day ago", trustScore: 70 },
  { id: 4, type: "poor_lighting", lat: 22.7180, lng: 75.8590, description: "Dark lane near Sarafa Bazaar", time: "3 hours ago", trustScore: 88 },
  { id: 5, type: "harassment", lat: 22.7300, lng: 75.8800, description: "Group following near Vijay Nagar", time: "6 hours ago", trustScore: 78 },
  { id: 6, type: "unsafe_street", lat: 19.0630, lng: 72.8450, description: "Waterlogged road near Bandra", time: "1 hour ago", trustScore: 91 },
  { id: 7, type: "suspicious", lat: 12.9780, lng: 77.6380, description: "Suspicious activity near park", time: "4 hours ago", trustScore: 74 },
];

// Analytics mock data
export const ANALYTICS_DATA = {
  totalReports: 347,
  resolvedReports: 218,
  activeAlerts: 12,
  avgResponseTime: '8 min',
  reportsByType: [
    { type: 'Harassment', count: 98, color: '#ef4444' },
    { type: 'Poor Lighting', count: 87, color: '#f59e0b' },
    { type: 'Unsafe Street', count: 76, color: '#3b82f6' },
    { type: 'Suspicious', count: 54, color: '#8b5cf6' },
    { type: 'Other', count: 32, color: '#6b7280' },
  ],
  weeklyTrend: [
    { day: 'Mon', reports: 28 },
    { day: 'Tue', reports: 35 },
    { day: 'Wed', reports: 42 },
    { day: 'Thu', reports: 31 },
    { day: 'Fri', reports: 55 },
    { day: 'Sat', reports: 68 },
    { day: 'Sun', reports: 48 },
  ],
  cityBreakdown: [
    { city: 'Delhi', count: 134 },
    { city: 'Indore', count: 78 },
    { city: 'Mumbai', count: 65 },
    { city: 'Bangalore', count: 42 },
    { city: 'Others', count: 28 },
  ],
};

export function calculateSafetyScore(timeOfDay, crimeIndex, lightingIndex, crowdIndex) {
  const timeWeight = timeOfDay === 'night' ? 0.3 : 0.1;
  const crimeWeight = 0.35;
  const lightingWeight = 0.2;
  const crowdWeight = 0.15;

  const timeScore = timeOfDay === 'night' ? 30 : 85;
  const score = Math.round(
    timeScore * timeWeight +
    crimeIndex * crimeWeight +
    lightingIndex * lightingWeight +
    crowdIndex * crowdWeight
  );
  return Math.max(0, Math.min(100, score));
}

export function getRoutes(from, to) {
  const baseDist = Math.random() * 5 + 2;
  return [
    {
      id: 'safest',
      type: 'safest',
      safetyScore: Math.floor(Math.random() * 15) + 85,
      distance: (baseDist * 1.3).toFixed(1),
      duration: Math.floor(baseDist * 1.3 * 4) + Math.floor(Math.random() * 10),
      color: 'safe',
      highlights: ['Well-lit roads', 'CCTV coverage', 'Police patrol area'],
    },
    {
      id: 'balanced',
      type: 'balanced',
      safetyScore: Math.floor(Math.random() * 20) + 60,
      distance: (baseDist * 1.1).toFixed(1),
      duration: Math.floor(baseDist * 1.1 * 4) + Math.floor(Math.random() * 8),
      color: 'caution',
      highlights: ['Moderate traffic', 'Some dark patches', 'Market area'],
    },
    {
      id: 'fastest',
      type: 'fastest',
      safetyScore: Math.floor(Math.random() * 25) + 35,
      distance: baseDist.toFixed(1),
      duration: Math.floor(baseDist * 3.5) + Math.floor(Math.random() * 5),
      color: 'danger',
      highlights: ['Through narrow lanes', 'Poor lighting', 'Isolated stretch'],
    },
  ];
}

export const DEFAULT_CONTACTS = [
  { id: 1, name: "Mom", phone: "+91 98765 43210", relation: "Family" },
  { id: 2, name: "Dad", phone: "+91 98765 43211", relation: "Family" },
  { id: 3, name: "Best Friend", phone: "+91 87654 32109", relation: "Friend" },
];