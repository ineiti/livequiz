import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { CourseComponent } from './course/course.component';
import { DojoComponent } from './course/dojo/dojo.component';
import { CourseManageComponent } from './course/course-manage/course-manage.component';

export const routes: Routes = [
    {
        path: 'course/:courseId',
        component: CourseComponent,
        children: [
            {
                path: '', pathMatch: 'full',
                component: CourseManageComponent,
            },
            {
                path: 'dojo',
                component: DojoComponent,
            }
        ]
    },
    { path: '', component: LandingComponent, pathMatch: 'full' },
    { path: '**', redirectTo: '/' }
];
