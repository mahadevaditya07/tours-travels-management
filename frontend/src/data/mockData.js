export const destinations = [
  { id: 1, name: "Gokarna", state: "Karnataka", image: "/images/gokarna.jpg", description: "Golden beaches, cliffs and relaxed coastal escapes." },
  { id: 2, name: "Coorg", state: "Karnataka", image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=80", description: "Misty hills, coffee estates and green valleys." },
  { id: 3, name: "Dandeli", state: "Karnataka", image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80", description: "Wild forests, rivers and adventure experiences." },
  { id: 4, name: "Munnar", state: "Kerala", image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80", description: "Tea gardens, mountain roads and cool weather." }
  ,{ id: 5, name: "Murudeshwar", state: "Karnataka", image: "/images/murudeshwara.jpg", description: "Famous for the towering Shiva statue and coastal views." }
  ,{ id: 6, name: "Badami", state: "Karnataka", image: "/images/badami.jpg", description: "Ancient cave temples carved into red sandstone cliffs." }
  ,{ id: 7, name: "Pattadakallu", state: "Karnataka", image: "/images/pattadakallu.jpg", description: "A UNESCO site with Chalukyan temples and sculptural heritage." }
  ,{ id: 8, name: "Bijapur", state: "Karnataka", image: "/images/bijapura.jpg", description: "Historic city with grand monuments and Bahmani architecture." }
  ,{ id: 9, name: "Jog Falls", state: "Karnataka", image: "/images/jogfalls.jpg", description: "One of India's highest waterfalls and dramatic viewpoints." }
  ,{ id: 10, name: "Hampi", state: "Karnataka", image: "/images/hampi.jpg", description: "Ruins of an ancient empire set among boulder-strewn landscapes." }
  ,{ id: 11, name: "Mangalore", state: "Karnataka", image: "/images/mangaluru.jpg", description: "Coastal city with beaches, temples and rich cuisine." }
  ,{ id: 12, name: "Udupi", state: "Karnataka", image: "/images/udupi.jpg", description: "Known for its Krishna temple and coastal charm." }
];

export const tours = [
  { id: "gokarna-escape", title: "Gokarna Coastal Escape", destination: "Gokarna, Karnataka", duration: "3 Days / 2 Nights", price: 6999, rating: 4.8, image: destinations[0].image, category: "Beach", places: ["Om Beach", "Kudle Beach", "Yana Caves"], description: "A laid-back coastal journey combining beaches, sunsets and local culture.", dates: ["2026-09-05", "2026-09-19", "2026-10-03"], included: ["Hotel stay", "Local sightseeing", "Breakfast"], excluded: ["Personal expenses", "Adventure activities"] },
  { id: "coorg-retreat", title: "Coorg Coffee Trail", destination: "Coorg, Karnataka", duration: "4 Days / 3 Nights", price: 8999, rating: 4.7, image: destinations[1].image, category: "Nature", places: ["Abbey Falls", "Raja's Seat", "Coffee Estate"], description: "Explore the misty hills of Coorg with coffee trails and waterfall visits.", dates: ["2026-09-12", "2026-10-10"], included: ["Resort stay", "Breakfast", "Sightseeing"], excluded: ["Lunch and dinner", "Personal expenses"] },
  { id: "dandeli-adventure", title: "Dandeli Adventure", destination: "Dandeli, Karnataka", duration: "2 Days / 1 Night", price: 5499, rating: 4.9, image: destinations[2].image, category: "Adventure", places: ["Kali River", "Syntheri Rocks", "Wildlife Safari"], description: "A high-energy forest escape with river adventures and wildlife.", dates: ["2026-09-06", "2026-09-20"], included: ["Stay", "Breakfast", "Forest entry"], excluded: ["Rafting charges", "Personal expenses"] },
  { id: "munnar-mountains", title: "Munnar Mountain Journey", destination: "Munnar, Kerala", duration: "5 Days / 4 Nights", price: 11999, rating: 4.9, image: destinations[3].image, category: "Mountains", places: ["Tea Gardens", "Top Station", "Mattupetty Dam"], description: "A scenic mountain trip through tea plantations and misty viewpoints.", dates: ["2026-09-18", "2026-10-16"], included: ["Hotel", "Breakfast", "Transfers"], excluded: ["Entry tickets", "Personal expenses"] }

  ,{ id: "murudeshwar-temple-coast", title: "Murudeshwar Coastal & Temple Trip", destination: "Murudeshwar, Karnataka", duration: "2 Days / 1 Night", price: 4999, rating: 4.6, image: "/images/murudeshwara.jpg", category: "Heritage", places: ["Murudeshwar Temple", "Netrani Island"], description: "Visit the towering Shiva statue and enjoy coastal views.", dates: ["2026-09-10", "2026-09-24"], included: ["Hotel", "Temple visit", "Breakfast"], excluded: ["Boat charges", "Personal expenses"] }

  ,{ id: "badami-caves-tour", title: "Badami Cave Temples", destination: "Badami, Karnataka", duration: "2 Days / 1 Night", price: 5999, rating: 4.7, image: "/images/badami.jpg", category: "Heritage", places: ["Badami Caves", "Agastya Lake", "Bhutanatha Group"], description: "Explore ancient rock-cut temples and historic sites.", dates: ["2026-09-15", "2026-10-01"], included: ["Stay", "Breakfast", "Guide"], excluded: ["Entry fees", "Personal expenses"] }

  ,{ id: "pattadakallu-heritage", title: "Pattadakallu Temple Trail", destination: "Pattadakallu, Karnataka", duration: "1 Day", price: 2999, rating: 4.5, image: "/images/pattadakallu.jpg", category: "Heritage", places: ["Pattadakallu Temples", "Aihole"], description: "Day trip to admire Chalukyan temple architecture.", dates: ["2026-09-20", "2026-10-05"], included: ["Transport", "Guide"], excluded: ["Lunch", "Entry fees"] }

  ,{ id: "bijapur-monuments", title: "Bijapur Historical Monuments", destination: "Bijapur, Karnataka", duration: "2 Days / 1 Night", price: 5499, rating: 4.6, image: "/images/bijapura.jpg", category: "Heritage", places: ["Gol Gumbaz", "Ibrahim Rauza"], description: "A guided tour of Bijapur's grand monuments.", dates: ["2026-09-22", "2026-10-07"], included: ["Stay", "Breakfast", "Sightseeing"], excluded: ["Entry fees", "Personal expenses"] }

  ,{ id: "jogfalls-view", title: "Jog Falls Getaway", destination: "Jog Falls, Karnataka", duration: "1 Day", price: 2499, rating: 4.8, image: "/images/jogfalls.jpg", category: "Nature", places: ["Viewpoints", "Local trails"], description: "Short trip to witness the spectacular waterfall.", dates: ["2026-09-08", "2026-09-29"], included: ["Transport"], excluded: ["Food", "Personal expenses"] }

  ,{ id: "hampi-ruins", title: "Hampi Heritage Explorer", destination: "Hampi, Karnataka", duration: "2 Days / 1 Night", price: 7999, rating: 4.9, image: "/images/hampi.jpg", category: "Heritage", places: ["Vijaya Vittala", "Virupaksha Temple", "Royal Enclosure"], description: "Explore the ruins and scenic boulder landscapes of Hampi.", dates: ["2026-09-28", "2026-10-12"], included: ["Stay", "Breakfast", "Local transport"], excluded: ["Guide fees", "Entry"] }

  ,{ id: "mangalore-coast", title: "Mangalore Coastal Taste & Sights", destination: "Mangalore, Karnataka", duration: "2 Days / 1 Night", price: 5999, rating: 4.5, image: "/images/mangaluru.jpg", category: "Coastal", places: ["Panambur Beach", "St. Aloysius Chapel"], description: "Enjoy beaches and local cuisine in Mangalore.", dates: ["2026-09-14", "2026-09-30"], included: ["Stay", "Breakfast"], excluded: ["Food", "Personal expenses"] }

  ,{ id: "udupi-temple-coast", title: "Udupi Temple & Backwaters", destination: "Udupi, Karnataka", duration: "1 Day", price: 2799, rating: 4.6, image: "/images/udupi.jpg", category: "Cultural", places: ["Sri Krishna Temple", "Malpe Beach"], description: "A short cultural trip including a famous temple visit.", dates: ["2026-09-11", "2026-09-25"], included: ["Transport"], excluded: ["Food", "Personal expenses"] }
];

export const vehicles = [
  // extra vehicles (kept first so canonical vehicles determine per-capacity mapping)
  { id: "innova", name: "Toyota Innova", capacity: 6, mileage: 12, costPerKm: 20, description: "Spacious and comfortable for family trips." },
  { id: "swift", name: "Maruti Swift", capacity: 3, mileage: 20, costPerKm: 12, description: "Fuel-efficient hatchback for city and short trips." },
  { id: "etios", name: "Toyota Etios", capacity: 3, mileage: 18, costPerKm: 13, description: "Reliable sedan with good boot space." },
  { id: "travera", name: "Tavera / Travera", capacity: 6, mileage: 12, costPerKm: 18, description: "Good for medium groups and inter-city travel." },
  { id: "cruiser", name: "Force Traveller", capacity: 13, mileage: 9, costPerKm: 22, description: "Robust traveller for larger groups and long hauls." },
  // canonical fleet (ensure tests map to these per-capacity rates)
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
  ,Badami: [15.9187, 75.7597]
  ,Pattadakallu: [15.9372, 75.7860]
  ,Bijapur: [16.8300, 75.7150]
  ,JogFalls: [14.2366, 74.5898]
  ,Hampi: [15.3350, 76.4600]
  ,Udupi: [13.3409, 74.7421]
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
  ,Murudeshwar: [
    { id: "murudeshwar-temple", name: "Murudeshwar Temple", type: "Temple", distance: 1, image: "/images/murudeshwara.jpg", description: "Iconic Shiva statue and coastal temple complex." }
  ]
  ,Badami: [
    { id: "badami-caves", name: "Badami Caves", type: "Heritage", distance: 2, image: "/images/badami.jpg", description: "Rock-cut cave temples with intricate sculptures." }
  ]
  ,Pattadakallu: [
    { id: "pattadakallu-temples", name: "Pattadakallu Temples", type: "Heritage", distance: 3, image: "/images/pattadakallu.jpg", description: "Group of Chalukyan temples with polished carvings." }
  ]
  ,Bijapur: [
    { id: "gol-gumbaz", name: "Gol Gumbaz", type: "Monument", distance: 2, image: "/images/bijapura.jpg", description: "Massive dome and historic tomb complex." }
  ]
  ,JogFalls: [
    { id: "jog-viewpoint", name: "Jog Falls Viewpoint", type: "Nature", distance: 1, image: "/images/jogfalls.jpg", description: "Spectacular waterfall views during monsoon." }
  ]
  ,Hampi: [
    { id: "vijaya-vittala", name: "Vijaya Vittala", type: "Heritage", distance: 2, image: "/images/hampi.jpg", description: "Famous stone chariot and musical pillars." }
  ]
  ,Udupi: [
    { id: "udupi-temple", name: "Sri Krishna Temple", type: "Temple", distance: 1, image: "/images/udupi.jpg", description: "Renowned Krishna temple and cultural hub." }
  ]
};