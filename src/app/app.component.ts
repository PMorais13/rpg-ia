import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { LlamaService } from './llama.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  prompt = '';
  loading = signal(false);
  error = signal<string | null>(null);
  constructor(public readonly llama: LlamaService) {}

  async send() {
    if (!this.prompt.trim()) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.llama.chat(this.prompt);
      this.prompt = '';
    } catch (e: any) {
      this.error.set(e?.message ?? 'Erro ao conectar no Ollama');
    } finally {
      this.loading.set(false);
    }
  }

  reset() {
    this.llama.reset();
  }
}
