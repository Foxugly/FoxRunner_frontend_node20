import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { Table } from 'primeng/table';

@Component({
  selector: 'app-table-toolbar',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="flex flex-wrap gap-2 align-items-center justify-content-between mb-3">
      <input
        pInputText
        type="search"
        [(ngModel)]="query"
        (input)="table.filterGlobal(query, 'contains')"
        [placeholder]="placeholder"
        [attr.aria-label]="placeholder"
        class="w-full md:w-20rem"
      />
      <p-button
        label="Effacer les filtres"
        icon="pi pi-filter-slash"
        severity="secondary"
        [outlined]="true"
        (onClick)="clear()"
      />
    </div>
  `,
})
export class TableToolbarComponent {
  @Input({ required: true }) table!: Table;
  @Input() placeholder = 'Rechercher';

  query = '';

  clear(): void {
    this.query = '';
    this.table.clear();
  }
}
