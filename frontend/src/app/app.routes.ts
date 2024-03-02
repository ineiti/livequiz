import { Routes } from '@angular/router';
import { StudentComponent } from './student/student.component';
import { AdminComponent } from './admin/admin.component';

export const routes: Routes = [
    { path: 'student', component: StudentComponent },
    { path: 'admin', component: AdminComponent },
    { path: '**', redirectTo: '/student'}
];
