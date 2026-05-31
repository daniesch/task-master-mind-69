import { createFileRoute } from "@tanstack/react-router";
import TasksApp from "@/components/TasksApp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aufgaben — Was schaffst du jetzt?" },
      { name: "description", content: "Smarte Aufgabenverwaltung mit Dauer-, Fälligkeits- und Wiederholungs-Tracking. Sag wie viel Zeit du hast und finde sofort die richtige Aufgabe." },
      { property: "og:title", content: "Aufgaben — Was schaffst du jetzt?" },
      { property: "og:description", content: "Smarte Aufgabenverwaltung mit Zeit-basierten Vorschlägen." },
    ],
  }),
  component: TasksApp,
});
