import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type GenReq = { model: string; prompt: string; stream?: boolean };
type GenRes = { response?: string };

@Injectable({ providedIn: 'root' })
export class LlamaService {
private readonly baseUrl = 'http://localhost:11434/api';
  // coloque aqui o nome EXATO que aparece em /api/tags
  private model = 'qwen2.5:1.5b'; // ajuste conforme o seu

  private readonly narratorPrompt =
    'Você é o narrador de uma campanha de RPG. ' +
    'Responda sempre descrevendo cenários, NPCs e consequências das ações ' +
    'do jogador de forma envolvente.';

  constructor(private http: HttpClient) {}

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
    const body = {
      model: this.model,
      messages: [
        { role: 'system', content: this.narratorPrompt },
        { role: 'user', content: prompt },
      ],
      stream: false,
    };
    try {
      const res: any = await firstValueFrom(
        this.http.post(`${this.baseUrl}/chat`, body)
      );
      return res?.message?.content ?? '';
    } catch (e: any) {
      const msg = e?.error?.error || e?.message || 'Erro 500 no Ollama';
      throw new Error(msg);
    }
  }
}
