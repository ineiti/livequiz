import { Routes } from '@angular/router';
import { StudentComponent } from './student/student.component';
import { AdminComponent } from './admin/admin.component';
import { CorrectionsComponent } from './corrections/corrections.component';

export const routes: Routes = [
    { path: 'corrections', component: CorrectionsComponent },
    { path: 'student', component: StudentComponent },
    { path: 'admin', component: AdminComponent },
    { path: '**', redirectTo: '/student'}
];
