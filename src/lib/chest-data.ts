import { practitioners, type Practitioner } from "./mock-data";

export type ChestHospital = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  emergency: boolean;
  beds: number;
  departments: string[];
  specialistIds: string[];
  consultationFee: number;
};

// Inject a few chest/pulmonology specialists alongside existing practitioners
const chestSpecialists: Practitioner[] = [
  { id: "uc1", name: "Dr. Arjun Mehta", role: "Specialist", specialty: "Pulmonology", organization: "Apex Chest & Lung Institute" },
  { id: "uc2", name: "Dr. Naina Kapoor", role: "Specialist", specialty: "Pulmonology", organization: "Apex Chest & Lung Institute" },
  { id: "uc3", name: "Dr. Rohit Verma", role: "Specialist", specialty: "Pulmonology", organization: "BreathWell Respiratory Hospital" },
  { id: "uc4", name: "Dr. Saira Iqbal", role: "Specialist", specialty: "Thoracic Surgery", organization: "BreathWell Respiratory Hospital" },
  { id: "uc5", name: "Dr. Karan Joshi", role: "Specialist", specialty: "Pulmonology", organization: "MediCare Chest Hospital" },
  { id: "uc6", name: "Dr. Anita Roy", role: "Specialist", specialty: "Interventional Pulmonology", organization: "MediCare Chest Hospital" },
];

// Mutate the shared list once so dropdowns / scheduling pick them up.
if (!practitioners.find((p) => p.id === "uc1")) {
  practitioners.push(...chestSpecialists);
}

export const chestHospitals: ChestHospital[] = [
  {
    id: "h1",
    name: "Apex Chest & Lung Institute",
    city: "Mumbai",
    address: "21 Marine Drive, Mumbai",
    phone: "+91 22 4000 1100",
    emergency: true,
    beds: 180,
    departments: ["Pulmonology", "Thoracic Surgery", "Sleep Medicine", "Critical Care"],
    specialistIds: ["uc1", "uc2"],
    consultationFee: 1200,
  },
  {
    id: "h2",
    name: "BreathWell Respiratory Hospital",
    city: "Delhi",
    address: "8 Saket District, New Delhi",
    phone: "+91 11 4200 5500",
    emergency: true,
    beds: 220,
    departments: ["Pulmonology", "Thoracic Surgery", "Allergy & Immunology"],
    specialistIds: ["uc3", "uc4"],
    consultationFee: 1500,
  },
  {
    id: "h3",
    name: "MediCare Chest Hospital",
    city: "Bengaluru",
    address: "MG Road, Bengaluru",
    phone: "+91 80 4900 7300",
    emergency: false,
    beds: 120,
    departments: ["Pulmonology", "Interventional Pulmonology", "Respiratory Rehab"],
    specialistIds: ["uc5", "uc6"],
    consultationFee: 900,
  },
  {
    id: "h4",
    name: "St. Aldwyn Cardiac & Chest Centre",
    city: "London",
    address: "St. Aldwyn Square, London",
    phone: "+44 20 7946 4400",
    emergency: true,
    beds: 95,
    departments: ["Cardiology", "Pulmonology", "Cardiothoracic Surgery"],
    specialistIds: ["u3"],
    consultationFee: 2200,
  },
];

export function getHospital(id: string) {
  return chestHospitals.find((h) => h.id === id);
}