import { useState } from "react";
import { Plus, Clock, Calendar, Repeat, Trash2, CheckCircle2, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { useTasks, type RepeatInterval, repeatLabels, daysUntil, formatDuration, type Task } from "@/lib/tasks-store";
import { cn } from "@/lib/utils";

export default function TasksApp() {
  const { tasks, addTask, removeTask, completeTask } = useTasks();
  const [open, setOpen] = useState(false);
  const [availableMinutes, setAvailableMinutes] = useState(30);

  // Form state
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [repeat, setRepeat] = useState<RepeatInterval>("none");

  const openTasks = tasks.filter((t) => !t.completed);
  const overdue = openTasks.filter((t) => daysUntil(t.dueDate) < 0);
  const today = openTasks.filter((t) => daysUntil(t.dueDate) === 0);
  const upcoming = openTasks.filter((t) => daysUntil(t.dueDate) > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const suggestions = [...openTasks]
    .filter((t) => t.durationMinutes <= availableMinutes)
    .sort((a, b) => {
      const da = daysUntil(a.dueDate);
      const db = daysUntil(b.dueDate);
      if (da !== db) return da - db;
      return b.durationMinutes - a.durationMinutes;
    });

  function submit() {
    if (!title.trim() || !duration || !dueDate) return;
    addTask({
      title: title.trim(),
      durationMinutes: Number(duration),
      dueDate,
      repeat,
    });
    setTitle(""); setDuration(""); setRepeat("none");
    setDueDate(new Date().toISOString().slice(0, 10));
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-10 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Deine Aufgaben</p>
            <h1 className="text-3xl font-bold text-foreground mt-1">Was schaffst du heute?</h1>
          </div>
        </div>
      </header>

      <main className="px-5 space-y-6 max-w-2xl mx-auto">
        {/* Time-based suggestion */}
        <Card className="p-5 border-0 text-primary-foreground shadow-[var(--shadow-elegant)]" style={{ background: "var(--gradient-primary)" }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4" />
            <h2 className="font-semibold">Ich habe Zeit für…</h2>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-4xl font-bold">{availableMinutes}</span>
            <span className="text-sm opacity-90">Minuten verfügbar</span>
          </div>
          <Slider
            value={[availableMinutes]}
            onValueChange={(v) => setAvailableMinutes(v[0])}
            min={5} max={240} step={5}
            className="my-3"
          />
          <div className="mt-4 space-y-2">
            {suggestions.length === 0 ? (
              <p className="text-sm opacity-90">Keine passende Aufgabe für diese Zeit.</p>
            ) : (
              suggestions.slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/15 backdrop-blur px-3 py-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.title}</p>
                    <p className="text-xs opacity-80">{formatDuration(t.durationMinutes)} · fällig {dueLabel(t.dueDate)}</p>
                  </div>
                  <Button size="sm" variant="secondary" className="shrink-0" onClick={() => completeTask(t.id)}>
                    Erledigt
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Overview */}
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between gap-3">
            <TabsList>
              <TabsTrigger value="all">Alle ({openTasks.length})</TabsTrigger>
              <TabsTrigger value="today">Heute ({today.length})</TabsTrigger>
              <TabsTrigger value="overdue">Überfällig ({overdue.length})</TabsTrigger>
            </TabsList>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Neu
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Neue Aufgabe</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Bezeichnung</Label>
                    <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Küche aufräumen" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">Geschätzte Dauer (Minuten)</Label>
                    <Input id="duration" type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="due">Fällig bis</Label>
                    <Input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Wiederholung</Label>
                    <Select value={repeat} onValueChange={(v) => setRepeat(v as RepeatInterval)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(repeatLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={submit}>Hinzufügen</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="all" className="mt-4 space-y-2">
            {openTasks.length === 0 && <EmptyState />}
            {overdue.map((t) => <TaskRow key={t.id} task={t} onDone={completeTask} onDelete={removeTask} />)}
            {today.map((t) => <TaskRow key={t.id} task={t} onDone={completeTask} onDelete={removeTask} />)}
            {upcoming.map((t) => <TaskRow key={t.id} task={t} onDone={completeTask} onDelete={removeTask} />)}
          </TabsContent>
          <TabsContent value="today" className="mt-4 space-y-2">
            {today.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nichts für heute. ✨</p>}
            {today.map((t) => <TaskRow key={t.id} task={t} onDone={completeTask} onDelete={removeTask} />)}
          </TabsContent>
          <TabsContent value="overdue" className="mt-4 space-y-2">
            {overdue.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Alles im grünen Bereich.</p>}
            {overdue.map((t) => <TaskRow key={t.id} task={t} onDone={completeTask} onDelete={removeTask} />)}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function dueLabel(date: string): string {
  const d = daysUntil(date);
  if (d < 0) return `vor ${-d} Tg.`;
  if (d === 0) return "heute";
  if (d === 1) return "morgen";
  return `in ${d} Tg.`;
}

function TaskRow({ task, onDone, onDelete }: { task: Task; onDone: (id: string) => void; onDelete: (id: string) => void }) {
  const d = daysUntil(task.dueDate);
  const isOverdue = d < 0;
  const isToday = d === 0;

  return (
    <Card className="p-4 flex items-center gap-3 shadow-[var(--shadow-soft)] border-border/60">
      <button
        onClick={() => onDone(task.id)}
        className="shrink-0 rounded-full text-primary hover:text-primary-glow transition-colors"
        aria-label="Erledigt"
      >
        <CheckCircle2 className="h-7 w-7" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{task.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{formatDuration(task.durationMinutes)}</span>
          <span className={cn(
            "inline-flex items-center gap-1",
            isOverdue && "text-destructive font-medium",
            isToday && "text-accent-foreground font-medium",
          )}>
            {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
            {dueLabel(task.dueDate)}
          </span>
          {task.repeat !== "none" && (
            <Badge variant="secondary" className="gap-1 font-normal">
              <Repeat className="h-3 w-3" />{repeatLabels[task.repeat]}
            </Badge>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
        aria-label="Löschen"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <p className="text-muted-foreground">Noch keine Aufgaben.</p>
      <p className="text-sm text-muted-foreground mt-1">Tippe auf „Neu" um zu starten.</p>
    </div>
  );
}
