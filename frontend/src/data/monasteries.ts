import { Monastery } from '../types/monastery';

export const monasteries: Monastery[] = [
  {
    id: '1',
    name: 'Rumtek Monastery',
    location: {
      district: 'East Sikkim',
      coordinates: { lat: 27.3389, lng: 88.5493 }
    },
    foundingYear: 1740,
    description: 'The Rumtek Monastery, also called the Dharmachakra Centre, is a gompa located in the Indian state of Sikkim near the capital Gangtok. It is the seat-in-exile of the Gyalwang Karmapa, inaugurated in 1966 by the 16th Karmapa.',
    significance: 'One of the most important monasteries in Sikkim and the seat of the Karmapa lineage.',
    virtualTourImages: [
      'https://images.unsplash.com/photo-1577500729553-2bc7b3576db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWRkaGlzdCUyMG1vbmFzdGVyeSUyMGhpbWFsYXlhbiUyMG1vdW50YWluc3xlbnwxfHx8fDE3NTgxMjkyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080',
      'https://images.unsplash.com/photo-1545295589-31aa01261ba1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aWJldCUyMG1vbmFzdGVyeSUyMGludGVyaW9yJTIwbXVyYWxzfGVufDF8fHx8MTc1ODEyOTIxNXww&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    archiveItems: [
      {
        id: 'r1',
        title: 'Sacred Tibetan Manuscript',
        type: 'manuscript',
        description: 'Ancient Buddhist texts from the 18th century containing teachings on compassion and wisdom.',
        imageUrl: 'https://images.unsplash.com/photo-1752161670149-0967a8670b0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwYnVkZGhpc3QlMjBtYW51c2NyaXB0c3xlbnwxfHx8fDE3NTgxMjkyMjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        dateCreated: '1742',
        digitalizedDate: '2023-03-15'
      },
      {
        id: 'r2',
        title: 'Main Hall Murals',
        type: 'mural',
        description: 'Intricate wall paintings depicting the life of Buddha and various bodhisattvas.',
        imageUrl: 'https://images.unsplash.com/photo-1545295589-31aa01261ba1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aWJldCUyMG1vbmFzdGVyeSUyMGludGVyaW9yJTIwbXVyYWxzfGVufDF8fHx8MTc1ODEyOTIxNXww&ixlib=rb-4.1.0&q=80&w=1080',
        dateCreated: '1966',
        digitalizedDate: '2023-01-20'
      }
    ],
    audioGuide: {
      introduction: 'Welcome to Rumtek Monastery, the seat-in-exile of the Karmapa lineage and one of Sikkim\'s most sacred sites.',
      highlights: [
        {
          id: 'rh1',
          title: 'Main Temple Hall',
          description: 'Explore the golden stupa and ancient murals that tell the story of Buddhism in Sikkim.',
          duration: 180,
          location: 'Central Temple'
        },
        {
          id: 'rh2',
          title: 'Monastery Museum',
          description: 'Discover rare artifacts and religious objects brought from Tibet.',
          duration: 120,
          location: 'Museum Wing'
        }
      ],
      duration: 45
    },
    upcomingEvents: [
      {
        id: 're1',
        title: 'Losar Festival Celebration',
        date: '2025-02-10',
        time: '06:00',
        description: 'Traditional Tibetan New Year celebrations with prayers, dances, and ceremonial activities.',
        type: 'festival',
        canBook: true,
        maxParticipants: 200
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1577500729553-2bc7b3576db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWRkaGlzdCUyMG1vbmFzdGVyeSUyMGhpbWFsYXlhbiUyMG1vdW50YWluc3xlbnwxfHx8fDE3NTgxMjkyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '2',
    name: 'Pemayangtse Monastery',
    location: {
      district: 'West Sikkim',
      coordinates: { lat: 27.2120, lng: 88.2123 }
    },
    foundingYear: 1705,
    description: 'Pemayangtse Monastery is a Buddhist monastery in Pemayangtse, near Pelling in the northeastern Indian state of Sikkim, located 110 km west of Gangtok.',
    significance: 'One of the oldest and most significant monasteries in Sikkim, head monastery of the Nyingma order.',
    virtualTourImages: [
      'https://images.unsplash.com/photo-1577500729553-2bc7b3576db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWRkaGlzdCUyMG1vbmFzdGVyeSUyMGhpbWFsYXlhbiUyMG1vdW50YWluc3xlbnwxfHx8fDE3NTgxMjkyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    archiveItems: [
      {
        id: 'p1',
        title: 'Nyingma Texts Collection',
        type: 'manuscript',
        description: 'Rare collection of Nyingma school teachings and practices from the 18th century.',
        imageUrl: 'https://images.unsplash.com/photo-1752161670149-0967a8670b0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwYnVkZGhpc3QlMjBtYW51c2NyaXB0c3xlbnwxfHx8fDE3NTgxMjkyMjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        dateCreated: '1720',
        digitalizedDate: '2023-05-10'
      }
    ],
    audioGuide: {
      introduction: 'Discover Pemayangtse, meaning "Perfect Sublime Lotus", the head monastery of the Nyingma order in Sikkim.',
      highlights: [
        {
          id: 'ph1',
          title: 'Sacred Assembly Hall',
          description: 'Marvel at the intricate wood carvings and ancient Buddhist statues.',
          duration: 150,
          location: 'Main Hall'
        }
      ],
      duration: 35
    },
    upcomingEvents: [
      {
        id: 'pe1',
        title: 'Cham Dance Festival',
        date: '2025-03-15',
        time: '09:00',
        description: 'Traditional masked dance performances by monastery monks.',
        type: 'festival',
        canBook: true,
        maxParticipants: 150
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1577500729553-2bc7b3576db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWRkaGlzdCUyMG1vbmFzdGVyeSUyMGhpbWFsYXlhbiUyMG1vdW50YWluc3xlbnwxfHx8fDE3NTgxMjkyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    id: '3',
    name: 'Tashiding Monastery',
    location: {
      district: 'West Sikkim',
      coordinates: { lat: 27.2849, lng: 88.2631 }
    },
    foundingYear: 1641,
    description: 'Tashiding Monastery is a Buddhist monastery of the Nyingma sect of Tibetan Buddhism in Western Sikkim, northeastern India, which is the most sacred and holiest monasteries in Sikkim.',
    significance: 'Considered the most sacred monastery in Sikkim, believed to cleanse sins with just a sight of it.',
    virtualTourImages: [
      'https://images.unsplash.com/photo-1577500729553-2bc7b3576db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWRkaGlzdCUyMG1vbmFzdGVyeSUyMGhpbWFsYXlhbiUyMG1vdW50YWluc3xlbnwxfHx8fDE3NTgxMjkyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080'
    ],
    archiveItems: [
      {
        id: 't1',
        title: 'Sacred Relics Collection',
        type: 'artifact',
        description: 'Ancient Buddhist relics and ceremonial objects dating back to the 17th century.',
        imageUrl: 'https://images.unsplash.com/photo-1752161670149-0967a8670b0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmNpZW50JTIwYnVkZGhpc3QlMjBtYW51c2NyaXB0c3xlbnwxfHx8fDE3NTgxMjkyMjB8MA&ixlib=rb-4.1.0&q=80&w=1080',
        dateCreated: '1650',
        digitalizedDate: '2023-04-08'
      }
    ],
    audioGuide: {
      introduction: 'Welcome to Tashiding, the holiest monastery in Sikkim, perched atop a sacred hill.',
      highlights: [
        {
          id: 'th1',
          title: 'Holy Water Blessing',
          description: 'Learn about the sacred Bumchu ceremony and the monastery\'s spiritual significance.',
          duration: 200,
          location: 'Sacred Spring'
        }
      ],
      duration: 40
    },
    upcomingEvents: [
      {
        id: 'te1',
        title: 'Bumchu Festival',
        date: '2025-01-25',
        time: '05:00',
        description: 'Sacred water blessing ceremony, one of the most important festivals in Sikkim.',
        type: 'ritual',
        canBook: false
      }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1577500729553-2bc7b3576db2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidWRkaGlzdCUyMG1vbmFzdGVyeSUyMGhpbWFsYXlhbiUyMG1vdW50YWluc3xlbnwxfHx8fDE3NTgxMjkyMDl8MA&ixlib=rb-4.1.0&q=80&w=1080'
  }
];