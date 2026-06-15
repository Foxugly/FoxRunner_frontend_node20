import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AdminService } from '../../../core/api/admin.service';
import { fetchAllPages } from '../../../core/api/pagination';
import type { AuditEntry } from '../../../core/api/types';
import { ApiDatePipe } from '../../../shared/pipes/api-date.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TableToolbarComponent } from '../../../shared/components/table-toolbar/table-toolbar.component';

@Component({
  selector: 'app-admin-audit',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    TooltipModule,
    ApiDatePipe,
    EmptyStateComponent,
    PageHeaderComponent,
    TableToolbarComponent,
  ],
  template: `
    <app-page-header icon="pi-list" title="Audit">
      <p-button
        label="Retour admin"
        icon="pi pi-arrow-left"
        severity="secondary"
        [text]="true"
        routerLink="/admin"
      />
      <p-button
        icon="pi pi-refresh"
        severity="secondary"
        [text]="true"
        [loading]="loading()"
        (onClick)="reload()"
      />
    </app-page-header>

    <div class="flex gap-3 mb-3 flex-wrap">
      <div class="flex flex-column gap-1">
        <label for="actor" class="text-sm text-color-secondary">Acteur</label>
        <input
          id="actor"
          pInputText
          [(ngModel)]="filterActor"
          placeholder="email ou UUID"
          (keyup.enter)="reload()"
        />
      </div>
      <div class="flex flex-column gap-1">
        <label for="tgt-type" class="text-sm text-color-secondary">Type cible</label>
        <input
          id="tgt-type"
          pInputText
          [(ngModel)]="filterTargetType"
          placeholder="scenario, slot, user, setting…"
          (keyup.enter)="reload()"
        />
      </div>
      <div class="flex flex-column gap-1">
        <label for="tgt-id" class="text-sm text-color-secondary">ID cible</label>
        <input id="tgt-id" pInputText [(ngModel)]="filterTargetId" (keyup.enter)="reload()" />
      </div>
      <div class="flex align-items-end">
        <p-button
          label="Appliquer"
          icon="pi pi-filter"
          severity="secondary"
          [text]="true"
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
      [globalFilterFields]="['created_at', 'actor_user_id', 'action', 'target_type', 'target_id']"
      dataKey="id"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="caption">
        <app-table-toolbar [table]="table" placeholder="Rechercher dans l’audit" />
      </ng-template>
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="created_at" style="width: 12rem">
            Quand <p-sortIcon field="created_at" />
          </th>
          <th pSortableColumn="actor_user_id">Acteur <p-sortIcon field="actor_user_id" /></th>
          <th pSortableColumn="action">Action <p-sortIcon field="action" /></th>
          <th pSortableColumn="target_type">Cible <p-sortIcon field="target_type" /></th>
          <th>Détails</th>
        </tr>
        <tr>
          <th><p-columnFilter field="created_at" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="actor_user_id" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="action" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="target_id" type="text" [showMenu]="false" /></th>
          <th></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-a>
        <tr>
          <td>{{ a.created_at | apiDate: 'medium' }}</td>
          <td>{{ a.actor_user_id }}</td>
          <td><p-tag severity="info" [value]="a.action" /></td>
          <td>
            <div class="text-sm">
              <div>{{ a.target_type }}</div>
              <code class="text-xs">{{ a.target_id }}</code>
            </div>
          </td>
          <td
            class="text-xs font-mono text-color-secondary text-overflow-ellipsis overflow-hidden white-space-nowrap"
            [style.max-width.rem]="30"
            [pTooltip]="diff(a)"
            tooltipPosition="left"
          >
            {{ diff(a) }}
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="5">
            <app-empty-state
              icon="pi-list"
              title="Aucune entrée"
              message="Le journal est vide pour ces filtres."
            />
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminAuditComponent implements OnInit {
  private readonly service = inject(AdminService);

  readonly items = signal<AuditEntry[]>([]);
  readonly loading = signal(false);

  filterActor = '';
  filterTargetType = '';
  filterTargetId = '';

  ngOnInit(): void {
    void this.load();
  }

  reload(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(
        await fetchAllPages((limit, offset) =>
          this.service.audit({
            actor_user_id: this.filterActor || undefined,
            target_type: this.filterTargetType || undefined,
            target_id: this.filterTargetId || undefined,
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

  diff(a: AuditEntry): string {
    const before = JSON.stringify(a.before ?? {});
    const after = JSON.stringify(a.after ?? {});
    return `before=${before} → after=${after}`;
  }
}
