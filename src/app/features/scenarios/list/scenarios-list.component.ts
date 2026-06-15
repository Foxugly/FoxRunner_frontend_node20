import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/auth/auth.service';
import { ScenariosService } from '../../../core/api/scenarios.service';
import { fetchAllPages } from '../../../core/api/pagination';
import type { ScenarioSummary } from '../../../core/api/types';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TableToolbarComponent } from '../../../shared/components/table-toolbar/table-toolbar.component';

@Component({
  selector: 'app-scenarios-list',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    DialogModule,
    InputTextModule,
    ConfirmDialogModule,
    PageHeaderComponent,
    EmptyStateComponent,
    TableToolbarComponent,
  ],
  template: `
    <app-page-header icon="pi-sitemap" title="Scénarios">
      <p-button
        icon="pi pi-refresh"
        severity="secondary"
        [text]="true"
        [loading]="loading()"
        (onClick)="reload()"
        pTooltip="Rafraîchir"
      />
      <p-button label="Nouveau" icon="pi pi-plus" routerLink="/scenarios/new" />
    </app-page-header>

    <p-table
      #table
      [value]="items()"
      [paginator]="true"
      [rows]="25"
      [loading]="loading()"
      [rowsPerPageOptions]="[10, 25, 50]"
      [globalFilterFields]="['scenario_id', 'description', 'role']"
      dataKey="scenario_id"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="caption">
        <app-table-toolbar [table]="table" placeholder="Rechercher dans les scénarios" />
      </ng-template>
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="scenario_id">Scenario ID <p-sortIcon field="scenario_id" /></th>
          <th pSortableColumn="description">Description <p-sortIcon field="description" /></th>
          <th pSortableColumn="role" style="width: 8rem">Rôle <p-sortIcon field="role" /></th>
          <th pSortableColumn="requires_enterprise_network" style="width: 10rem">
            Réseau <p-sortIcon field="requires_enterprise_network" />
          </th>
          <th style="width: 9rem">Actions</th>
        </tr>
        <tr>
          <th><p-columnFilter field="scenario_id" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="description" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="role" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="requires_enterprise_network" type="boolean" /></th>
          <th></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-s>
        <tr>
          <td>
            <a [routerLink]="['/scenarios', s.scenario_id]">{{ s.scenario_id }}</a>
          </td>
          <td>{{ s.description || '—' }}</td>
          <td>
            @if (s.role === 'owner') {
              <p-tag severity="success" value="Propriétaire" />
            } @else {
              <p-tag severity="info" value="Partagé" />
            }
          </td>
          <td>
            @if (s.requires_enterprise_network) {
              <span pTooltip="Requiert le réseau entreprise/VPN">
                <i class="pi pi-lock mr-1"></i>Entreprise
              </span>
            } @else {
              <span class="text-color-secondary">Public</span>
            }
          </td>
          <td>
            <div class="flex gap-1">
              <p-button
                icon="pi pi-eye"
                [rounded]="true"
                [text]="true"
                size="small"
                severity="secondary"
                [routerLink]="['/scenarios', s.scenario_id]"
                pTooltip="Détail"
              />
              @if (s.writable) {
                <p-button
                  icon="pi pi-copy"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="askDuplicate(s)"
                  pTooltip="Dupliquer"
                />
                <p-button
                  icon="pi pi-trash"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="danger"
                  (onClick)="askDelete(s)"
                  pTooltip="Supprimer"
                />
              }
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="5">
            <app-empty-state
              icon="pi-sitemap"
              title="Aucun scénario"
              message="Crée un premier scénario pour démarrer."
            >
              <p-button label="Créer un scénario" icon="pi pi-plus" routerLink="/scenarios/new" />
            </app-empty-state>
          </td>
        </tr>
      </ng-template>
    </p-table>

    <p-dialog
      header="Dupliquer le scénario"
      [modal]="true"
      [(visible)]="duplicateOpen"
      [style]="{ width: '420px' }"
    >
      <div class="flex flex-column gap-3">
        <label for="newId">Nouvel identifiant</label>
        <input id="newId" pInputText [(ngModel)]="duplicateNewId" placeholder="mon_scenario_v2" />
      </div>
      <ng-template pTemplate="footer">
        <p-button label="Annuler" severity="secondary" [text]="true" (onClick)="closeDuplicate()" />
        <p-button
          label="Dupliquer"
          icon="pi pi-copy"
          [loading]="duplicating()"
          [disabled]="!duplicateNewId || duplicating()"
          (onClick)="runDuplicate()"
        />
      </ng-template>
    </p-dialog>

    <p-confirmDialog />
  `,
})
export class ScenariosListComponent implements OnInit {
  private readonly service = inject(ScenariosService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmationService);
  private readonly messages = inject(MessageService);

  readonly items = signal<ScenarioSummary[]>([]);
  readonly loading = signal(false);

  duplicateOpen = false;
  duplicating = signal(false);
  duplicateNewId = '';
  private duplicateSource: ScenarioSummary | null = null;

  ngOnInit(): void {
    void this.load();
  }

  reload(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const me = this.auth.currentUser();
    if (!me) return;
    this.loading.set(true);
    try {
      this.items.set(
        await fetchAllPages((limit, offset) => this.service.list(me.id, limit, offset)),
      );
    } catch {
      /* interceptor toasts */
    } finally {
      this.loading.set(false);
    }
  }

  askDuplicate(s: ScenarioSummary): void {
    this.duplicateSource = s;
    this.duplicateNewId = `${s.scenario_id}_copy`;
    this.duplicateOpen = true;
  }

  closeDuplicate(): void {
    this.duplicateOpen = false;
    this.duplicateSource = null;
    this.duplicateNewId = '';
  }

  async runDuplicate(): Promise<void> {
    if (!this.duplicateSource || !this.duplicateNewId) return;
    this.duplicating.set(true);
    try {
      const dup = await this.service.duplicate(
        this.duplicateSource.scenario_id,
        this.duplicateNewId,
      );
      this.messages.add({
        severity: 'success',
        summary: 'Scénario dupliqué',
        detail: dup.scenario_id,
        life: 3000,
      });
      this.closeDuplicate();
      this.reload();
    } catch {
      /* toast */
    } finally {
      this.duplicating.set(false);
    }
  }

  askDelete(s: ScenarioSummary): void {
    this.confirm.confirm({
      header: `Supprimer « ${s.scenario_id} » ?`,
      message: 'Cette action est irréversible. Les slots associés deviendront invalides.',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      acceptButtonProps: { severity: 'danger' },
      accept: async () => {
        try {
          await this.service.remove(s.scenario_id);
          this.messages.add({
            severity: 'success',
            summary: 'Scénario supprimé',
            detail: s.scenario_id,
            life: 3000,
          });
          this.reload();
        } catch {
          /* toast */
        }
      },
    });
  }

  goToNew(): void {
    this.router.navigate(['/scenarios', 'new']);
  }
}
