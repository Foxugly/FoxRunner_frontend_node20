import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/auth/auth.service';
import { JobsService } from '../../../core/api/jobs.service';
import { fetchAllPages } from '../../../core/api/pagination';
import type { Job } from '../../../core/api/types';
import { ApiDatePipe } from '../../../shared/pipes/api-date.pipe';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { StatusTagComponent } from '../../../shared/components/status-tag/status-tag.component';
import { TableToolbarComponent } from '../../../shared/components/table-toolbar/table-toolbar.component';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [
    RouterLink,
    TableModule,
    ButtonModule,
    TooltipModule,
    ApiDatePipe,
    PageHeaderComponent,
    EmptyStateComponent,
    StatusTagComponent,
    TableToolbarComponent,
  ],
  template: `
    <app-page-header icon="pi-play" title="Jobs">
      <p-button
        icon="pi pi-refresh"
        severity="secondary"
        [text]="true"
        [loading]="loading()"
        (onClick)="reload()"
        pTooltip="Rafraîchir"
      />
      @if (autoRefreshing()) {
        <span class="text-color-secondary text-sm ml-2">
          <i class="pi pi-sync pi-spin mr-1"></i>auto 10s
        </span>
      }
    </app-page-header>

    <p-table
      #table
      [value]="items()"
      [paginator]="true"
      [rows]="25"
      [loading]="loading()"
      [rowsPerPageOptions]="[10, 25, 50]"
      [globalFilterFields]="['job_id', 'target_id', 'status']"
      dataKey="job_id"
      styleClass="p-datatable-sm"
    >
      <ng-template pTemplate="caption">
        <app-table-toolbar [table]="table" placeholder="Rechercher dans les jobs" />
      </ng-template>
      <ng-template pTemplate="header">
        <tr>
          <th pSortableColumn="job_id">Job ID <p-sortIcon field="job_id" /></th>
          <th pSortableColumn="target_id">Scénario <p-sortIcon field="target_id" /></th>
          <th pSortableColumn="status" style="width: 7rem">Statut <p-sortIcon field="status" /></th>
          <th pSortableColumn="dry_run" style="width: 4rem">
            Dry-run <p-sortIcon field="dry_run" />
          </th>
          <th pSortableColumn="created_at" style="width: 10rem">
            Créé le <p-sortIcon field="created_at" />
          </th>
          <th pSortableColumn="finished_at" style="width: 10rem">
            Terminé le <p-sortIcon field="finished_at" />
          </th>
          <th style="width: 7rem">Actions</th>
        </tr>
        <tr>
          <th><p-columnFilter field="job_id" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="target_id" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="status" type="text" [showMenu]="false" /></th>
          <th><p-columnFilter field="dry_run" type="boolean" /></th>
          <th><p-columnFilter field="created_at" type="date" /></th>
          <th><p-columnFilter field="finished_at" type="date" /></th>
          <th></th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-j>
        <tr>
          <td>
            <a [routerLink]="['/jobs', j.job_id]" class="font-mono">{{ j.job_id.slice(0, 8) }}…</a>
          </td>
          <td>{{ j.target_id }}</td>
          <td><app-status-tag [status]="j.status" /></td>
          <td>{{ j.dry_run ? 'Oui' : 'Non' }}</td>
          <td>{{ j.created_at | apiDate }}</td>
          <td>{{ j.finished_at | apiDate }}</td>
          <td>
            <div class="flex gap-1">
              <p-button
                icon="pi pi-eye"
                [rounded]="true"
                [text]="true"
                size="small"
                severity="secondary"
                [routerLink]="['/jobs', j.job_id]"
                pTooltip="Détail"
              />
              @if (j.status === 'queued' || j.status === 'running') {
                <p-button
                  icon="pi pi-times"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="danger"
                  (onClick)="cancelJob(j)"
                  pTooltip="Annuler"
                />
              }
              @if (j.status === 'failed' || j.status === 'cancelled') {
                <p-button
                  icon="pi pi-refresh"
                  [rounded]="true"
                  [text]="true"
                  size="small"
                  severity="secondary"
                  (onClick)="retryJob(j)"
                  pTooltip="Relancer"
                />
              }
            </div>
          </td>
        </tr>
      </ng-template>
      <ng-template pTemplate="emptymessage">
        <tr>
          <td colspan="7">
            <app-empty-state
              icon="pi-inbox"
              title="Aucun job"
              message="Lance un scénario pour voir ses exécutions ici."
            />
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
})
export class JobsListComponent implements OnInit, OnDestroy {
  private readonly service = inject(JobsService);
  private readonly auth = inject(AuthService);
  private readonly messages = inject(MessageService);

  readonly items = signal<Job[]>([]);
  readonly loading = signal(false);
  readonly autoRefreshing = signal(false);
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    void this.load();
  }

  ngOnDestroy(): void {
    this.stopAutoRefresh();
  }

  reload(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const me = this.auth.currentUser();
    this.loading.set(true);
    try {
      const items = await fetchAllPages((limit, offset) =>
        this.service.list({ user_id: me?.id, limit, offset }),
      );
      this.items.set(items);
      const hasActive = items.some((j) => j.status === 'queued' || j.status === 'running');
      if (hasActive) this.startAutoRefresh();
      else this.stopAutoRefresh();
    } catch {
      /* toast */
    } finally {
      this.loading.set(false);
    }
  }

  private startAutoRefresh(): void {
    if (this.refreshTimer) return;
    this.autoRefreshing.set(true);
    this.refreshTimer = setInterval(() => this.reload(), 10_000);
  }

  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.autoRefreshing.set(false);
  }

  async cancelJob(job: Job): Promise<void> {
    try {
      await this.service.cancel(job.job_id, job.user_id);
      this.messages.add({
        severity: 'success',
        summary: 'Job annulé',
        detail: job.job_id,
        life: 3000,
      });
      this.reload();
    } catch {
      /* toast */
    }
  }

  async retryJob(job: Job): Promise<void> {
    try {
      await this.service.retry(job.job_id, job.user_id);
      this.messages.add({
        severity: 'success',
        summary: 'Job relancé',
        detail: job.job_id,
        life: 3000,
      });
      this.reload();
    } catch {
      /* toast */
    }
  }
}
