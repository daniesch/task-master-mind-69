import { useEffect, useState, useCallback } from "react";

export type RepeatInterval = "none" | "daily" | "weekly" | "biweekly" | "monthly" | "yearly";

export interface Task {
  id: string;
  title: string;
  durationMinutes: number;
  dueDate: string; // ISO date
  repeat: RepeatInterval;
  completed: boolean;
  createdAt: string;
}

const KEY = "tasks_app_v1";

function read(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(tasks: Task[]) {
  localStorage.setItem(KEY, JSON.stringify(tasks));
  window.dispatchEvent(new Event("tasks:updated"));
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(read());
    const handler = () => setTasks(read());
    window.addEventListener("tasks:updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("tasks:updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const addTask = useCallback((t: Omit<Task, "id" | "completed" | "createdAt">) => {
    const next: Task = {
      ...t,
      id: crypto.randomUUID(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    write([...read(), next]);
  }, []);

  const removeTask = useCallback((id: string) => {
    write(read().filter((t) => t.id !== id));
  }, []);

  const completeTask = useCallback((id: string) => {
    const all = read();
    const task = all.find((t) => t.id === id);
    if (!task) return;
    if (task.repeat === "none") {
      write(all.map((t) => (t.id === id ? { ...t, completed: true } : t)));
    } else {
      const nextDue = computeNextDue(task.dueDate, task.repeat);
      write(all.map((t) => (t.id === id ? { ...t, dueDate: nextDue } : t)));
    }
  }, []);

  return { tasks, addTask, removeTask, completeTask };
}

function computeNextDue(dueDate: string, repeat: RepeatInterval): string {
  const d = new Date(dueDate);
  switch (repeat) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString().slice(0, 10);
}

export const repeatLabels: Record<RepeatInterval, string> = {
  none: "Einmalig",
  daily: "Täglich",
  weekly: "1x Wöchentlich",
  biweekly: "Alle 2 Wochen",
  monthly: "1x Monatlich",
  yearly: "1x Jährlich",
};

export function daysUntil(dueDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - today.getTime()) / 86400000);
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} Min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}
