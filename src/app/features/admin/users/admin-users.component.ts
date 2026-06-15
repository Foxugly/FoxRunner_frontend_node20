import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TooltipModule } from 'primeng/tooltip';
import { AdminService } from '../../../core/api/admin.service';
import { fetchAllPages } from '../../../core/api/pagination';
import type { UserSummary } from '../../../core/api/types';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TableToolbarComponent } from '../../../shared/components/table-toolbar/table-toolbar.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    ButtonModule,
    TagModule,
    TooltipModule,
    ToggleSwitchModule,
    PageHeaderComponent,
    EmptyStateComponent,
    TableToolbarComponent,
  ],
  template: `
    <app-page-header icon="pi-users" title="Utilisateurs">
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

    <p-table
      #table
      [value]="items()"
      [paginator]="true"
      [rows]="25"
      [loading]="loading()"
      [rowsPerPageOptions]="[10, 25, 50]"
      [globalFilterFields]="['email', 'id', 'timezone_name']"
      dataKey="id"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="caption">
        <app-table-toolbar [table]="table" placeholder="Rechercher un utilisateur" />
      </ng-template>
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="email">Email <p-sortIcon field="email" /></th>
          <th pSortableColumn="id" style="width: 18rem">UUID <p-sortIcon field="id" /></th>
          <th pSortableColumn="timezone_name">Fuseau <p-sortIcon field="timezone_name" /></th>
          <th pSortableColumn="is_active" style="width: 6rem">
            Actif <p-sortIcon field="is_active" />
          </th>
          <th pSortableColumn="is_superuser" style="width: 8rem">
            Superuser <p-sortIcon field="is_superuser" />
          </th>
          <th pSortableColumn="is_verified" style="width: 7rem">
            Vérifié <p-sortIcon field="is_verified" />
          </th>
        </tr>
        <tr>
          <th><p-columnFilter field="email" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="id" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="timezone_name" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="is_active" type="boolean" /></th>
          <th><p-columnFilter field="is_superuser" type="boolean" /></th>
          <th><p-columnFilter field="is_verified" type="boolean" /></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-u>
        <tr>
          <td>{{ u.email }}</td>
          <td>
            <code class="text-xs">{{ u.id }}</code>
          </td>
          <td>{{ u.timezone_name }}</td>
          <td>
            <p-toggleswitch
              [(ngModel)]="u.is_active"
              (onChange)="updateFlag(u, 'is_active', u.is_active)"
              [ariaLabel]="'Actif — ' + u.email"
            />
          </td>
          <td>
            <p-toggleswitch
              [(ngModel)]="u.is_superuser"
              (onChange)="updateFlag(u, 'is_superuser', u.is_superuser)"
              [ariaLabel]="'Superuser — ' + u.email"
            />
          </td>
          <td>
            <p-toggleswitch
              [(ngModel)]="u.is_verified"
              (onChange)="updateFlag(u, 'is_verified', u.is_verified)"
              [ariaLabel]="'Vérifié — ' + u.email"
            />
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="6">
            <app-empty-state icon="pi-users" title="Aucun utilisateur" />
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class AdminUsersComponent implements OnInit {
  private readonly service = inject(AdminService);
  private readonly messages = inject(MessageService);

  readonly items = signal<UserSummary[]>([]);
  readonly loading = signal(false);

  ngOnInit(): void {
    void this.load();
  }

  reload(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.items.set(await fetchAllPages((limit, offset) => this.service.listUsers(limit, offset)));
    } catch {
      /* toast */
    } finally {
      this.loading.set(false);
    }
  }

  async updateFlag(
    user: UserSummary,
    field: 'is_active' | 'is_superuser' | 'is_verified',
    value: boolean,
  ): Promise<void> {
    try {
      await this.service.updateUser(user.id, { [field]: value });
      this.messages.add({
        severity: 'success',
        summary: 'Utilisateur mis à jour',
        detail: `${user.email} · ${field}=${value}`,
        life: 2500,
      });
    } catch {
      // Optimistic rollback on failure.
      user[field] = !value;
    }
  }
}
