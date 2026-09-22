export const sample = {
  State: [
    ['Andhra Pradesh', 'State', '28'],
    ['Bihar', 'State', '10'],
    ['Uttar Pradesh', 'State', '09'],
    ['Maharashtra', 'State', '27'],
  ],
  District: [
    ['Munger', 'District', '239'],
    ['Patna', 'District', '227'],
    ['Gaya', 'District', '240'],
    ['Lucknow', 'District', '157'],
  ],
  'Sub-District': [
    ['Munger', 'Sub-District', '1823'],
    ['Jamalpur', 'Sub-District', '1824'],
    ['Sadar', 'Sub-District', '1825'],
    ['Patna Sadar', 'Sub-District', '1826'],
  ],
  'Development Block': [
    ['Example block record 1', 'Development Block', 'B10001'],
    ['Example block record 2', 'Development Block', 'B10002'],
    ['Example block record 3', 'Development Block', 'B10003'],
  ],
  Village: [
    ['Example village record', 'Village', '100001'],
    ['Example village record 2', 'Village', '100002'],
    ['Example village record 3', 'Village', '100003'],
    ['Example village record 4', 'Village', '100004'],
  ],
  'Rural Local Body': [
    ['Example gram panchayat 1', 'Rural Local Body', 'RLB10001'],
    ['Example gram panchayat 2', 'Rural Local Body', 'RLB10002'],
    ['Example gram panchayat 3', 'Rural Local Body', 'RLB10003'],
  ],
  'Traditional Local Body': [
    ['Example traditional body 1', 'Traditional Local Body', 'TLB10001'],
    ['Example traditional body 2', 'Traditional Local Body', 'TLB10002'],
  ],
  'Urban Local Body': [
    ['Example municipal body 1', 'Urban Local Body', 'ULB10001'],
    ['Example municipal body 2', 'Urban Local Body', 'ULB10002'],
    ['Example municipal body 3', 'Urban Local Body', 'ULB10003'],
  ],
  'Cantonment Board': [
    ['Example cantonment board 1', 'Cantonment Board', 'CB10001'],
    ['Example cantonment board 2', 'Cantonment Board', 'CB10002'],
  ],
}

export const levelLabels = {
  State: 'States / UTs',
  District: 'Districts',
  'Sub-District': 'Sub-Districts',
  'Development Block': 'Development Blocks',
  Village: 'Villages',
  'Rural Local Body': 'Rural Local Bodies',
  'Traditional Local Body': 'Traditional Local Bodies',
  'Urban Local Body': 'Urban Local Bodies',
  'Cantonment Board': 'Cantonment Boards',
}

export const hierarchyTree = [
  { label: 'States / UTs', value: '36', level: 'State' },
  { label: 'Districts', value: '784', level: 'District' },
  { label: 'Sub-Districts', value: '7,092', level: 'Sub-District' },
  { label: 'Development Blocks', value: '7,323', level: 'Development Block' },
  { label: 'Villages', value: '677,523', level: 'Village' },
]

export const localBodyTree = [
  { label: 'Rural Local Bodies', value: '262,820', level: 'Rural Local Body' },
  { label: 'Traditional Local Bodies', value: '14,164', level: 'Traditional Local Body' },
  { label: 'Urban Local Bodies', value: '5,050', level: 'Urban Local Body' },
  { label: 'Cantonment Boards', value: '60', level: 'Cantonment Board' },
]

export const heroStats = [
  { icon: 'ti-flag', value: '36', label: 'States & UTs' },
  { icon: 'ti-map', value: '784', label: 'Districts' },
  { icon: 'ti-map-2', value: '7,092', label: 'Sub-Districts' },
  { icon: 'ti-building', value: '7,323', label: 'Development Blocks' },
]