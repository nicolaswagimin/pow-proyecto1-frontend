import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { timestampDate } from '@bufbuild/protobuf/wkt';
import { APP_NOMBRE } from '../../config';
import { mapearErrorGrpc } from '../../core/errores';
import { TIPOS_DIAGRAMA, TipoSoportado } from '../../diagrama/tipos';
import { SavedDiagramSummary } from '../../gen/codetodiagram/v1/diagram_pb';
import { BarraApp } from '../../layouts/barra-app/barra-app';
import { DiagramasService } from '../../services/diagramas.service';
import { Alert } from '../../ui/alert/alert';
import { Button } from '../../ui/button/button';
import { Icon } from '../../ui/icon/icon';

// /historial: los diagramas guardados del usuario, del más reciente al más antiguo.
@Component({
  selector: 'app-historial',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, Alert, BarraApp, Button, Icon],
  templateUrl: './historial.html',
  styleUrl: './historial.css',
})
export class Historial {
  private readonly servicio = inject(DiagramasService);
  private readonly router = inject(Router);

  protected readonly diagramas = signal<SavedDiagramSummary[]>([]);
  protected readonly cargando = signal(true);
  protected readonly error = signal<string | null>(null);
  // Diagrama cuya eliminación espera confirmación (en línea, sin confirm() del navegador).
  protected readonly confirmando = signal<number | null>(null);
  protected readonly eliminando = signal<number | null>(null);

  constructor() {
    inject(Title).setTitle(`Historial · ${APP_NOMBRE}`);
    void this.cargar();
  }

  protected async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const { diagrams } = await this.servicio.listar();
      this.diagramas.set(diagrams);
    } catch (err) {
      const problema = mapearErrorGrpc(err);
      if (problema) this.error.set(problema.mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrir(id: number): void {
    void this.router.navigate(['/app'], { queryParams: { diagrama: id } });
  }

  protected async eliminar(id: number): Promise<void> {
    this.eliminando.set(id);
    this.error.set(null);
    try {
      await this.servicio.eliminar(id);
      this.diagramas.update((lista) => lista.filter((d) => d.id !== id));
      this.confirmando.set(null);
    } catch (err) {
      const problema = mapearErrorGrpc(err);
      if (problema) this.error.set(problema.mensaje);
    } finally {
      this.eliminando.set(null);
    }
  }

  protected etiquetaTipo(tipo: number): string {
    return TIPOS_DIAGRAMA[tipo as TipoSoportado]?.etiqueta ?? 'Diagrama';
  }

  protected fecha(d: SavedDiagramSummary): Date | null {
    return d.createdAt ? timestampDate(d.createdAt) : null;
  }
}
