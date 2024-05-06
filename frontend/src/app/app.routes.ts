import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { CourseComponent } from './course/course.component';
import { DojoComponent } from './course/dojo/dojo.component';
import { CourseManageComponent } from './course/course-manage/course-manage.component';
import { CorrectionsComponent } from './course/corrections/corrections.component';
import { ProgressComponent } from './course/progress/progress.component';
import { ResetComponent } from './reset/reset.component';
import { KataComponent } from './course/kata/kata.component';
import { EditQuizComponent } from './course/edit-quiz/edit-quiz.component';

export const routes: Routes = [
    {
        path: 'course/:courseId', component: CourseComponent,
        children: [
            { path: '', pathMatch: 'full', component: CourseManageComponent },
            { path: 'dojo', component: DojoComponent },
            { path: 'corrections', component: CorrectionsComponent },
            { path: 'progress', component: ProgressComponent },
            { path: 'createQuiz', component: EditQuizComponent },
            { path: 'editQuiz/:quizId', component: EditQuizComponent },
            { path: 'kata/:quizId', component: KataComponent },
        ]
    },
    { path: '', component: LandingComponent, pathMatch: 'full' },
    { path: 'reset', component: ResetComponent },
    { path: '**', redirectTo: '/' }
];
