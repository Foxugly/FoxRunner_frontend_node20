import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../core/auth/auth.service';
import { HistoryService } from '../../core/api/history.service';
import { fetchAllPages } from '../../core/api/pagination';
import type { History } from '../../core/api/types';
import { ApiDatePipe } from '../../shared/pipes/api-date.pipe';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusTagComponent } from '../../shared/components/status-tag/status-tag.component';
import { TableToolbarComponent } from '../../shared/components/table-toolbar/table-toolbar.component';

interface StatusOption {
  label: string;
  value: string | null;
}

const STATUS_OPTIONS: StatusOption[] = [
  { label: 'Tous', value: null },
  { label: 'Réussis', value: 'success' },
  { label: 'Échecs', value: 'failed' },
  { label: 'Annulés', value: 'cancelled' },
  { label: 'Ignorés', value: 'skipped' },
];

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    TooltipModule,
    ApiDatePipe,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusTagComponent,
    TableToolbarComponent,
  ],
  template: `
    <app-page-header icon="pi-history" title="Historique">
      <p-button
        icon="pi pi-refresh"
        severity="secondary"
        [text]="true"
        [loading]="loading()"
        (onClick)="reload()"
        pTooltip="Rafraîchir"
      />
    </app-page-header>

    <div class="flex gap-3 mb-3 flex-wrap">
      <div class="flex flex-column gap-1">
        <label for="f-status" class="text-sm text-color-secondary">Statut</label>
        <p-select
          inputId="f-status"
          [options]="statusOptions"
          [(ngModel)]="filterStatus"
          optionLabel="label"
          optionValue="value"
          placeholder="Tous"
          [style]="{ width: '12rem' }"
          (onChange)="reload()"
        />
      </div>
      <div class="flex flex-column gap-1">
        <label for="f-scenario" class="text-sm text-color-secondary">Scénario</label>
        <input
          id="f-scenario"
          pInputText
          [(ngModel)]="filterScenarioId"
          placeholder="scenario_id"
          (keyup.enter)="reload()"
        />
      </div>
      <div class="flex flex-column gap-1">
        <label for="f-slot" class="text-sm text-color-secondary">Slot</label>
        <input
          id="f-slot"
          pInputText
          [(ngModel)]="filterSlotId"
          placeholder="slot_id"
          (keyup.enter)="reload()"
        />
      </div>
      <div class="flex align-items-end">
        <p-button
          label="Appliquer"
          icon="pi pi-filter"
          [text]="true"
          severity="secondary"
          (onClick)="reload()"
        />
      </div>
    </div>

    <p-table
      #table
      [value]="items()"
      [paginator]="true"
      [rows]="50"
      [loading]="loading()"
      [rowsPerPageOptions]="[20, 50, 100]"
      [globalFilterFields]="['scenario_id', 'slot_id', 'status', 'step', 'message']"
      dataKey="id"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="caption">
        <app-table-toolbar [table]="table" placeholder="Rechercher dans l’historique" />
      </ng-template>
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="scenario_id">Scénario <p-sortIcon field="scenario_id" /></th>
          <th pSortableColumn="slot_id">Slot <p-sortIcon field="slot_id" /></th>
          <th pSortableColumn="status" style="width: 7rem">Statut <p-sortIcon field="status" /></th>
          <th pSortableColumn="executed_at" style="width: 12rem">
            Exécuté le <p-sortIcon field="executed_at" />
          </th>
          <th pSortableColumn="step">Étape <p-sortIcon field="step" /></th>
          <th pSortableColumn="message">Message <p-sortIcon field="message" /></th>
        </tr>
        <tr>
          <th><p-columnFilter field="scenario_id" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="slot_id" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="status" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="executed_at" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="step" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="message" type="text" [showMenu]="false" /></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-h>
        <tr>
          <td>{{ h.scenario_id }}</td>
          <td>{{ h.slot_id }}</td>
          <td><app-status-tag [status]="h.status" /></td>
          <td>{{ h.executed_at | apiDate: 'medium' }}</td>
          <td>{{ h.step }}</td>
          <td
            [pTooltip]="h.message"
            [style.max-width.rem]="30"
            class="text-overflow-ellipsis overflow-hidden white-space-nowrap"
          >
            {{ h.message }}
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="6">
            <app-empty-state
              icon="pi-history"
              title="Historique vide"
              message="Aucune exécution ne correspond aux filtres."
            />
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class HistoryComponent implements OnInit {
  private readonly service = inject(HistoryService);
  private readonly auth = inject(AuthService);

  readonly statusOptions = STATUS_OPTIONS;
  readonly items = signal<History[]>([]);
  readonly loading = signal(false);

  filterStatus: string | null = null;
  filterScenarioId = '';
  filterSlotId = '';

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
        await fetchAllPages((limit, offset) =>
          this.service.list(me.id, {
            status: this.filterStatus ?? undefined,
            scenario_id: this.filterScenarioId || undefined,
            slot_id: this.filterSlotId || undefined,
            limit,
            offset,
          }),
        ),
      );
    } catch {
      /* toast */
    } finally {
      this.loading.set(false);
    }
  }
}
