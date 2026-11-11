import type { CameraConfig, Zone } from '@/types'

export const SITE = {
  id: 'site-riverside',
  name: 'Riverside Tower - Construction Site',
  client: 'Riverside Developments',
}

export const ZONES: Zone[] = [
  { id: 'z-entrance', name: 'Site Entrance', type: 'safe', color: '#4FB286', description: 'Main gate and worker check-in lane' },
  { id: 'z-material', name: 'Material Storage', type: 'storage', color: '#5B9BD5', description: 'Rebar staging and laydown areas' },
  { id: 'z-highrise', name: 'High-Rise Floor', type: 'high-risk', color: '#D9645C', description: 'Open slab and deck work at height - fall hazard' },
  { id: 'z-crane', name: 'Crane Area', type: 'high-risk', color: '#D9884A', description: 'Lift radius, rigging and crane hook areas' },
  { id: 'z-excavation', name: 'Excavation Area', type: 'high-risk', color: '#C9A24D', description: 'Foundation pits, trenches and haul roads' },
  { id: 'z-welding', name: 'Welding Area', type: 'production', color: '#9B84C9', description: 'Hot work: welding and cutting bay' },
  { id: 'z-restricted', name: 'Restricted Zone', type: 'restricted', color: '#CF6C8B', description: 'Barricaded area - authorised personnel only' },
]

// Height slightly over 100 so feet at the very bottom edge (+ detector jitter) still count as inside.
const full = { x: 0, y: 0, width: 100, height: 110 }

// Camera order matters: track IDs are allocated in this order (see mock/actors.ts).
export const CAMERAS: CameraConfig[] = [
  {
    id: 'CAM-01', name: 'Main Gate', location: 'North entrance', image: '/cameras/gate.jpg', defaultZoneId: 'z-entrance', online: true,
    regions: [{ zoneId: 'z-entrance', rect: full }],
  },
  {
    id: 'CAM-02', name: 'Foundation Slab', location: 'Podium level, east bay', image: '/cameras/slab.jpg', defaultZoneId: 'z-excavation', online: true,
    regions: [
      { zoneId: 'z-excavation', rect: full },
      { zoneId: 'z-restricted', rect: { x: 62, y: 48, width: 24, height: 22 } },
    ],
  },
  {
    id: 'CAM-03', name: 'Tower Level 12', location: 'Core, level 12 deck', image: '/cameras/tower.jpg', defaultZoneId: 'z-material', online: true,
    regions: [
      { zoneId: 'z-material', rect: full },
      { zoneId: 'z-highrise', rect: { x: 40, y: 0, width: 60, height: 110 } },
    ],
  },
  {
    id: 'CAM-04', name: 'Rigging Bay', location: 'South crane pad', image: '/cameras/rigging.jpg', defaultZoneId: 'z-crane', online: true,
    regions: [{ zoneId: 'z-crane', rect: full }],
  },
  {
    id: 'CAM-05', name: 'Formwork Deck · Level 8', location: 'West wing, level 8', image: '/cameras/formwork.jpg', defaultZoneId: 'z-highrise', online: true,
    regions: [{ zoneId: 'z-highrise', rect: full }],
  },
  {
    id: 'CAM-06', name: 'Haul Road', location: 'South excavation', image: '/cameras/haul.jpg', defaultZoneId: 'z-excavation', online: true,
    regions: [
      { zoneId: 'z-excavation', rect: full },
      { zoneId: 'z-restricted', rect: { x: 80, y: 10, width: 20, height: 80 } },
    ],
  },
  {
    id: 'CAM-07', name: 'Welding Bay', location: 'East fabrication shed', image: '/cameras/welding.jpg', defaultZoneId: 'z-welding', online: true,
    regions: [{ zoneId: 'z-welding', rect: full }],
  },
  {
    id: 'CAM-08', name: 'North Perimeter', location: 'Fence line (maintenance)', image: '', defaultZoneId: 'z-entrance', online: false,
    regions: [],
  },
]

export const zoneById = (id: string): Zone => ZONES.find((z) => z.id === id) ?? ZONES[0]
export const cameraById = (id: string): CameraConfig | undefined => CAMERAS.find((c) => c.id === id)
