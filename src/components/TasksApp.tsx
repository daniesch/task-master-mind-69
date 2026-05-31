import { useState, useMemo } from "react";
import { Plus, Clock, Calendar, Repeat, Trash2, CheckCircle2, Sparkles, AlertCircle, Tag, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useTasks, type RepeatInterval, repeatLabels, daysUntil, formatDuration, type Task } from "@/lib/tasks-store";
import { cn } from "@/lib/utils";

export default function TasksApp() {
  const { tasks, categories, addTask, removeTask, completeTask, addCategory, removeCategory } = useTasks();
  const [open, setOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [availableMinutes, setAvailableMinutes] = useState(30);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [hasDueDate, setHasDueDate] = useState(true);
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [repeat, setRepeat] = useState<RepeatInterval>("none");
  const [category, setCategory] = useState<string>(categories[0] ?? "Allgemein");
  const [newCat, setNewCat] = useState("");

  const openTasks = useMemo(
    () => tasks.filter((t) => !t.completed && (filterCategory === "all" || t.category === filterCategory)),
    [tasks, filterCategory],
  );
  const overdue = openTasks.filter((t) => t.dueDate && daysUntil(t.dueDate) < 0);
  const today = openTasks.filter((t) => t.dueDate && daysUntil(t.dueDate) === 0);
  const upcoming = openTasks
    .filter((t) => t.dueDate && daysUntil(t.dueDate) > 0)
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""));
  const noDeadline = openTasks.filter((t) => !t.dueDate);

  const suggestions = [...openTasks]
    .filter((t) => t.durationMinutes <= availableMinutes)
    .sort((a, b) => {
      const da = daysUntil(a.dueDate);
      const db = daysUntil(b.dueDate);
      if (da !== db) return da - db;
      return b.durationMinutes - a.durationMinutes;
    });

  function submit() {
    if (!title.trim() || !duration) return;
    if (hasDueDate && !dueDate) return;
    addTask({
      title: title.trim(),
      durationMinutes: Number(duration),
      dueDate: hasDueDate ? dueDate : null,
      repeat,
      category,
    });
    setTitle(""); setDuration(""); setRepeat("none");
    setHasDueDate(true);
    setDueDate(new Date().toISOString().slice(0, 10));
    setOpen(false);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-5 pt-10 pb-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Deine Aufgaben</p>
          <h1 className="text-3xl font-bold text-foreground mt-1">Was schaffst du heute?</h1>
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
                    <p className="text-xs opacity-80">
                      {formatDuration(t.durationMinutes)} · {t.category}
                      {t.dueDate ? ` · fällig ${dueLabel(t.dueDate)}` : " · ohne Frist"}
                    </p>
                  </div>
                  <Button size="sm" variant="secondary" className="shrink-0" onClick={() => completeTask(t.id)}>
                    Erledigt
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <CategoryPill active={filterCategory === "all"} onClick={() => setFilterCategory("all")}>Alle</CategoryPill>
          {categories.map((c) => (
            <CategoryPill key={c} active={filterCategory === c} onClick={() => setFilterCategory(c)}>{c}</CategoryPill>
          ))}
          <Button size="sm" variant="ghost" className="shrink-0 gap-1" onClick={() => setCatOpen(true)}>
            <Tag className="h-3.5 w-3.5" /> Verwalten
          </Button>
        </div>

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
                    <Label>Kategorie</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                    <div>
                      <Label htmlFor="has-due" className="cursor-pointer">Mit Enddatum</Label>
                      <p className="text-xs text-muted-foreground">Aus = keine Frist</p>
                    </div>
                    <Switch id="has-due" checked={hasDueDate} onCheckedChange={setHasDueDate} />
                  </div>
                  {hasDueDate && (
                    <>
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
                    </>
                  )}
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
            {noDeadline.map((t) => <TaskRow key={t.id} task={t} onDone={completeTask} onDelete={removeTask} />)}
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

      {/* Manage categories dialog */}
      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategorien</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <Badge key={c} variant="secondary" className="gap-1 pl-2 pr-1 py-1">
                  {c}
                  <button onClick={() => removeCategory(c)} className="rounded-full hover:bg-background/50 p-0.5" aria-label="Entfernen">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Neue Kategorie"
                onKeyDown={(e) => {
                  if (e.key === "Enter") { addCategory(newCat); setNewCat(""); }
                }}
              />
              <Button onClick={() => { addCategory(newCat); setNewCat(""); }}>Hinzufügen</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-xs font-medium border transition-colors",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background text-muted-foreground border-border hover:text-foreground",
      )}
    >
      {children}
    </button>
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
  const d = task.dueDate ? daysUntil(task.dueDate) : null;
  const isOverdue = d !== null && d < 0;
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
          {task.dueDate ? (
            <span className={cn(
              "inline-flex items-center gap-1",
              isOverdue && "text-destructive font-medium",
              isToday && "text-accent-foreground font-medium",
            )}>
              {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
              {dueLabel(task.dueDate)}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 italic">ohne Frist</span>
          )}
          <Badge variant="outline" className="gap-1 font-normal">
            <Tag className="h-3 w-3" />{task.category}
          </Badge>
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
