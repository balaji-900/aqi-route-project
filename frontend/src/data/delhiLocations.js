// Curated directory of Delhi Landmarks, Transport Hubs, and official CPCB Air Quality Monitoring Stations
export const DELHI_LOCATIONS = [
  // --- Popular Landmarks & Cultural Centers ---
  { name: "Connaught Place (CP)", lat: 28.6315, lon: 77.2167, category: "Commercial Hub" },
  { name: "Red Fort (Lal Qila)", lat: 28.6562, lon: 77.2410, category: "Landmark" },
  { name: "India Gate", lat: 28.6129, lon: 77.2295, category: "Landmark" },
  { name: "Qutub Minar", lat: 28.5244, lon: 77.1855, category: "Landmark" },
  { name: "Hauz Khas Village", lat: 28.5494, lon: 77.1996, category: "Cultural Hub" },
  { name: "Lotus Temple (Kalkaji)", lat: 28.5535, lon: 77.2588, category: "Landmark" },
  { name: "Akshardham Temple", lat: 28.6127, lon: 77.2773, category: "Landmark" },
  { name: "Chandni Chowk", lat: 28.6506, lon: 77.2303, category: "Heritage / Market" },
  { name: "Dilli Haat (INA)", lat: 28.5733, lon: 77.2081, category: "Cultural Hub" },
  { name: "Humayun's Tomb", lat: 28.5933, lon: 77.2507, category: "Landmark" },
  { name: "Lodhi Garden", lat: 28.5933, lon: 77.2197, category: "Park / Landmark" },

  // --- Official CAAQMS Air Quality Monitoring Stations ---
  { name: "R.K. Puram (Station DL001)", lat: 28.5642, lon: 77.1806, category: "AQI Station" },
  { name: "Anand Vihar (Station DL002)", lat: 28.6476, lon: 77.3158, category: "AQI Station" },
  { name: "Punjabi Bagh (Station DL003)", lat: 28.6740, lon: 77.1310, category: "AQI Station" },
  { name: "Mandir Marg (Station DL004)", lat: 28.6364, lon: 77.2010, category: "AQI Station" },
  { name: "ITO (Station DL005)", lat: 28.6289, lon: 77.2415, category: "AQI Station" },
  { name: "Dwarka Sector 8 (Station DL006)", lat: 28.5710, lon: 77.0673, category: "AQI Station" },
  { name: "Rohini Sector 16 (Station DL007)", lat: 28.7325, lon: 77.1199, category: "AQI Station" },
  { name: "Okhla Phase 2 (Station DL008)", lat: 28.5308, lon: 77.2713, category: "AQI Station" },
  { name: "Jawaharlal Nehru Stadium (Station DL009)", lat: 28.5802, lon: 77.2338, category: "AQI Station" },
  { name: "Sri Aurobindo Marg (Station DL010)", lat: 28.5313, lon: 77.1901, category: "AQI Station" },
  { name: "Bawana (Station DL012)", lat: 28.7762, lon: 77.0511, category: "AQI Station" },
  { name: "Narela (Station DL013)", lat: 28.8228, lon: 77.1019, category: "AQI Station" },
  { name: "Patparganj (Station DL014)", lat: 28.6237, lon: 77.2872, category: "AQI Station" },
  { name: "Sonia Vihar (Station DL015)", lat: 28.7105, lon: 77.2494, category: "AQI Station" },
  { name: "Jahangirpuri (Station DL016)", lat: 28.7328, lon: 77.1706, category: "AQI Station" },
  { name: "Najafgarh (Station DL017)", lat: 28.5701, lon: 76.9338, category: "AQI Station" },
  { name: "Alipur (Station DL018)", lat: 28.8153, lon: 77.1530, category: "AQI Station" },
  { name: "Wazirpur (Station DL019)", lat: 28.6998, lon: 77.1654, category: "AQI Station" },
  { name: "Ashok Vihar (Station DL020)", lat: 28.6954, lon: 77.1817, category: "AQI Station" },

  // --- Transport Hubs & Major Sectors ---
  { name: "IGI Airport Terminal 3", lat: 28.5562, lon: 77.0999, category: "Transport Hub" },
  { name: "New Delhi Railway Station (NDLS)", lat: 28.6431, lon: 77.2195, category: "Transport Hub" },
  { name: "Old Delhi Railway Station (DLI)", lat: 28.6619, lon: 77.2280, category: "Transport Hub" },
  { name: "Kashmere Gate ISBT", lat: 28.6675, lon: 77.2333, category: "Transport Hub" },
  { name: "Sarai Kale Khan ISBT / Nizamuddin", lat: 28.5910, lon: 77.2570, category: "Transport Hub" },
  { name: "Karol Bagh Metro", lat: 28.6473, lon: 77.1901, category: "Metro / Commercial" },
  { name: "Lajpat Nagar Central Market", lat: 28.5700, lon: 77.2430, category: "Market" },
  { name: "Saket Select Citywalk", lat: 28.5284, lon: 77.2192, category: "Commercial" },
  { name: "Janakpuri District Centre", lat: 28.6297, lon: 77.0783, category: "Commercial" },
  { name: "Pitampura TV Tower", lat: 28.6989, lon: 77.1404, category: "Commercial" }
];

export const getAQICategory = (aqi) => {
  if (aqi <= 50) return { label: "Good", color: "#10B981", bg: "#ECFDF5", text: "#065F46", desc: "Air quality is satisfactory and poses little or no risk." };
  if (aqi <= 100) return { label: "Satisfactory", color: "#84CC16", bg: "#F7FEE7", text: "#365314", desc: "Minor breathing discomfort to sensitive people." };
  if (aqi <= 200) return { label: "Moderate", color: "#F59E0B", bg: "#FFFBEB", text: "#92400E", desc: "Breathing discomfort to people with lung, asthma, and heart diseases." };
  if (aqi <= 300) return { label: "Poor", color: "#F97316", bg: "#FFF7ED", text: "#9A3412", desc: "Breathing discomfort to most people on prolonged exposure." };
  if (aqi <= 400) return { label: "Very Poor", color: "#EF4444", bg: "#FEF2F2", text: "#991B1B", desc: "Respiratory illness on prolonged exposure." };
  return { label: "Severe", color: "#7F1D1D", bg: "#450A0A", text: "#FEF2F2", desc: "Healthy people affected and seriously impacts those with existing diseases." };
};
