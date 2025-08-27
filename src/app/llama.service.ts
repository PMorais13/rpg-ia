import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type GenReq = { model: string; prompt: string; stream?: boolean };
type GenRes = { response?: string };
type Message = { role: string; content: string };

@Injectable({ providedIn: 'root' })
export class LlamaService {
private readonly baseUrl = 'http://localhost:11434/api';
  // coloque aqui o nome EXATO que aparece em /api/tags
  private model = 'qwen2.5:1.5b'; // ajuste conforme o seu

  private readonly narratorPrompt =
    'Você é o narrador de uma campanha de RPG. ' +
    'Agora eu, como narrador, decidirei o rumo da campanha e apresentarei as próximas ações com base no que aconteceu. ' +
    'Preparem-se para o que vem a seguir e respondam conforme as situações se desenrolarem. ' +
    'Responda sempre descrevendo cenários, NPCs e consequências das ações do jogador de forma envolvente.';

  private readonly storageKey = 'rpg-ia-messages';

  messages = signal<Message[]>([
    { role: 'system', content: this.narratorPrompt },
  ]);

  constructor(private http: HttpClient) {
    const saved =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(this.storageKey)
        : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          this.messages.set(parsed);
        }
      } catch {
        /* ignore */
      }
    }
  }

  setModel(name: string) { this.model = name; }

  async generate(prompt: string): Promise<string> {
    const body: GenReq = {
      model: this.model,
      prompt: `${this.narratorPrompt}\n${prompt}`,
      stream: false,
    };
    try {
      const res = await firstValueFrom(
        this.http.post<GenRes>(`${this.baseUrl}/generate`, body)
      );
      return res.response ?? '';
    } catch (e: any) {
      // ajuda a depurar 500
      const msg = e?.error?.error || e?.message || 'Erro 500 no Ollama';
      throw new Error(msg);
    }
  }

  // Se quiser manter chat também:
  async chat(prompt: string): Promise<string> {
    this.messages.update((msgs) => [
      ...msgs,
      { role: 'user', content: prompt },
    ]);
    this.save();

    const body = {
      model: this.model,
      messages: this.messages(),
      stream: false,
    };
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.baseUrl}/chat`, body)
      );
      const content = res?.message?.content ?? '';
      this.messages.update((msgs) => [
        ...msgs,
        { role: 'assistant', content },
      ]);
      this.save();
      return content;
    } catch (e: any) {
      const msg = e?.error?.error || e?.message || 'Erro 500 no Ollama';
      throw new Error(msg);
    }
  }

  reset() {
    this.messages.set([{ role: 'system', content: this.narratorPrompt }]);
    this.save();
  }

  private save() {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.storageKey, JSON.stringify(this.messages()));
    }
  }
}
