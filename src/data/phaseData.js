export const phaseData = [
  {
    title: 'Houselisting & Housing Census (HLO)',
    summary: 'First phase covering house listing and housing information.',
    icon: 'ti-home-2',
    image: null, // reserved for a future phase image/illustration
    detail:
      "Every structure, house and household is listed and geo-tagged, building the frame the population count will run on. A 15-day self-enumeration window opens just before each state's door-to-door listing begins.",
    points: [
      'Housing conditions, amenities and household assets',
      'Drinking water, sanitation, energy access and connectivity',
      'Geo-tagging and a unique ID for every structure',
      'Type of structure — residential, commercial, or mixed use',
      'Ownership status and building material used',
      'Availability of internet and mobile connectivity',
      'Number of households residing in each structure',
      'Fuel used for cooking and lighting',
      'Vehicle ownership and household assets like TV, computer',
    ],
    tag: 'May-2026',
    tagClass: 'done',
  },
  {
    title: 'Population Enumeration (PE)',
    summary: 'Second phase for population enumeration and associated schedules.',
    icon: 'ti-users',
    image: null,
    detail:
      'Using the frame built in Phase I, enumerators record demographic, socio-economic and cultural details of every person in every household — including caste, enumerated nationally for the first time since 1931.',
    points: [
      'Snow-bound regions (Ladakh, J&K, Himachal Pradesh, Uttarakhand) use an earlier reference date of 1 Oct 2026',
      'Conducted via a mobile app, replacing the earlier paper-based method',
      'Approximately 30 lakh enumerators deployed nationwide',
    ],
    tag: 'Mar-2026',
    tagClass: 'done',
  },
  {
    title: 'Processing & Release',
    summary: 'Processing, tabulation and publication of Census outputs as notified.',
    icon: 'ti-chart-bar',
    image: null,
    detail:
      'Collected data is validated and tabulated by the Office of the Registrar General of India before Census outputs are released in stages as official publications.',
    points: [
      'Data validation and tabulation by ORGI',
      'Staggered release of provisional and final results',
      'Publications made available via the Census India portal',
    ],
    tag: 'Jan-2026',
    tagClass: 'done',
  },
]
