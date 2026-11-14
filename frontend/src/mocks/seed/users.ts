import type { Me } from "@/api/types";

// People from the mock-up (artifact "Front aplikacji PROMT").
export const seedUsers: Me[] = [
  {
    id: 1,
    email: "anna.wisniewska@example.com",
    first_name: "Anna",
    last_name: "Wiśniewska",
    is_staff: false,
  },
  {
    id: 2,
    email: "pm@example.com",
    first_name: "Paweł",
    last_name: "Zieliński",
    is_staff: true,
  },
  {
    id: 3,
    email: "karolina.lis@example.com",
    first_name: "Karolina",
    last_name: "Lis",
    is_staff: false,
  },
  {
    id: 4,
    email: "michal.dabrowski@example.com",
    first_name: "Michał",
    last_name: "Dąbrowski",
    is_staff: false,
  },
  {
    id: 5,
    email: "ewa.mazur@example.com",
    first_name: "Ewa",
    last_name: "Mazur",
    is_staff: false,
  },
  {
    id: 6,
    email: "tomasz.kruk@example.com",
    first_name: "Tomasz",
    last_name: "Kruk",
    is_staff: false,
  },
];
