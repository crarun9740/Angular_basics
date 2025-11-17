import { Component, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Todo {
  title: string;
  completed: boolean;
}

type Filter = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ CommonModule, FormsModule ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // App title
  readonly title = signal('Angular Todo — Modern');

  // Signal list
  readonly todos = signal<Todo[]>([]);

  // Input field signal
  readonly newTodo = signal('');

  // filter and editing
  readonly filter = signal<Filter>('all');
  readonly editingIndex = signal<number | null>(null);
  readonly editText = signal('');

  // visible items map original index -> todo so actions work on original list
  readonly visible = computed(() =>
    this.todos()
      .map((t, i) => ({ todo: t, index: i }))
      .filter((item) => {
        if (this.filter() === 'all') return true;
        if (this.filter() === 'active') return !item.todo.completed;
        return item.todo.completed;
      })
  );

  // Computed: remaining todos
  readonly remaining = computed(() => this.todos().filter((t) => !t.completed).length);

  // Computed: has completed todos
  readonly hasCompleted = computed(() => this.todos().some((t) => t.completed));

  constructor() {
    // load from localStorage
    try {
      const raw = localStorage.getItem('todos');
      if (raw) this.todos.set(JSON.parse(raw));
    } catch (e) {
      // ignore
    }

    // persist todos
    effect(() => {
      try {
        localStorage.setItem('todos', JSON.stringify(this.todos()));
      } catch {}
    });
  }

  // Add new todo
  addTodo() {
    const text = this.newTodo().trim();
    if (!text) return;

    this.todos.update((list) => [...list, { title: text, completed: false }]);

    this.newTodo.set('');
  }

  startEdit(index: number) {
    this.editingIndex.set(index);
    this.editText.set(this.todos()[index].title);
  }

  saveEdit() {
    const idx = this.editingIndex();
    if (idx === null) return;
    const text = this.editText().trim();
    if (!text) return this.cancelEdit();
    this.todos.update((list) => list.map((t, i) => (i === idx ? { ...t, title: text } : t)));
    this.editingIndex.set(null);
    this.editText.set('');
  }

  cancelEdit() {
    this.editingIndex.set(null);
    this.editText.set('');
  }

  // Toggle complete/incomplete
  toggle(index: number) {
    this.todos.update((list) =>
      list.map((t, i) => (i === index ? { ...t, completed: !t.completed } : t))
    );
  }

  // Remove a todo
  remove(index: number) {
    this.todos.update((list) => list.filter((_, i) => i !== index));
    if (this.editingIndex() === index) this.cancelEdit();
  }

  // Remove all completed
  clearCompleted() {
    this.todos.update((list) => list.filter((t) => !t.completed));
  }

  setFilter(value: Filter) {
    this.filter.set(value);
  }
}
