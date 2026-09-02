export const destinations = [
  { id: 1, name: "Gokarna", state: "Karnataka", image: "/images/gokarna.jpg", description: "Golden beaches, cliffs and relaxed coastal escapes." },
  { id: 2, name: "Coorg", state: "Karnataka", image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=80", description: "Misty hills, coffee estates and green valleys." },
  { id: 3, name: "Dandeli", state: "Karnataka", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80", description: "Wild forests, rivers and adventure experiences." },
  { id: 4, name: "Munnar", state: "Kerala", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80", description: "Tea gardens, mountain roads and cool weather." }
];

export const tours = [
  { id: "gokarna-escape", title: "Gokarna Coastal Escape", destination: "Gokarna, Karnataka", duration: "3 Days / 2 Nights", price: 6999, rating: 4.8, image: destinations[0].image, category: "Beach", places: ["Om Beach", "Kudle Beach", "Yana Caves"], description: "A laid-back coastal journey combining beaches, sunsets and local culture.", dates: ["2026-09-05", "2026-09-19", "2026-10-03"], included: ["Hotel stay", "Local sightseeing", "Breakfast"], excluded: ["Personal expenses", "Adventure activities"] },
  { id: "coorg-retreat", title: "Coorg Coffee Trail", destination: "Coorg, Karnataka", duration: "4 Days / 3 Nights", price: 8999, rating: 4.7, image: destinations[1].image, category: "Nature", places: ["Abbey Falls", "Raja's Seat", "Coffee Estate"], description: "Explore the misty hills of Coorg with coffee trails and waterfall visits.", dates: ["2026-09-12", "2026-10-10"], included: ["Resort stay", "Breakfast", "Sightseeing"], excluded: ["Lunch and dinner", "Personal expenses"] },
  { id: "dandeli-adventure", title: "Dandeli Adventure", destination: "Dandeli, Karnataka", duration: "2 Days / 1 Night", price: 5499, rating: 4.9, image: destinations[2].image, category: "Adventure", places: ["Kali River", "Syntheri Rocks", "Wildlife Safari"], description: "A high-energy forest escape with river adventures and wildlife.", dates: ["2026-09-06", "2026-09-20"], included: ["Stay", "Breakfast", "Forest entry"], excluded: ["Rafting charges", "Personal expenses"] },
  { id: "munnar-mountains", title: "Munnar Mountain Journey", destination: "Munnar, Kerala", duration: "5 Days / 4 Nights", price: 11999, rating: 4.9, image: destinations[3].image, category: "Mountains", places: ["Tea Gardens", "Top Station", "Mattupetty Dam"], description: "A scenic mountain trip through tea plantations and misty viewpoints.", dates: ["2026-09-18", "2026-10-16"], included: ["Hotel", "Breakfast", "Transfers"], excluded: ["Entry tickets", "Personal expenses"] }
];

export const vehicles = [
  // costPerKm updated to new pricing rules
  { id: "car", name: "Sedan", capacity: 4, mileage: 16, costPerKm: 15, description: "Comfortable for small groups." },
  { id: "suv", name: "SUV", capacity: 7, mileage: 14, costPerKm: 16, description: "Extra space for families and luggage." },
  { id: "tempo", name: "Tempo Traveller", capacity: 12, mileage: 10, costPerKm: 18, description: "Ideal for medium-sized groups." },
  { id: "bus", name: "Mini Bus", capacity: 25, mileage: 7, costPerKm: 23, description: "Best for larger groups." }
];

export const locations = {
  Hubli: [15.3647, 75.124],
  Dandeli: [15.2474, 74.6184],
  Gokarna: [14.5479, 74.3188],
  Murudeshwar: [14.0943, 74.4845],
  Mangalore: [12.9141, 74.856],
  Coorg: [12.3375, 75.8069],
  Mysore: [12.2958, 76.6394],
  Munnar: [10.0889, 77.0595]
};

export const attractions = {
  Gokarna: [
    { id: "om", name: "Om Beach", type: "Beach", distance: 5, image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=80", description: "A beautiful crescent-shaped beach known for sunsets." },
    { id: "kudle", name: "Kudle Beach", type: "Beach", distance: 4, image: "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=700&q=80", description: "A peaceful beach perfect for an evening walk." }
  ],
  Dandeli: [
    { id: "kali", name: "Kali River", type: "Adventure", distance: 3, image: "https://images.unsplash.com/photo-1437482078695-73f5ca6c96e2?auto=format&fit=crop&w=700&q=80", description: "A popular location for river activities." },
    { id: "syntheri", name: "Syntheri Rocks", type: "Nature", distance: 25, image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=80", description: "Dramatic rock formations surrounded by forest." }
  ],
  Coorg: [
    { id: "abbey", name: "Abbey Falls", type: "Waterfall", distance: 7, image: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=700&q=80", description: "A lush waterfall surrounded by coffee plantations." }
  ]
};