import { Component, Input } from '@angular/core';
import { BreadcrumbService } from '../../components/breadcrumb/breadcrumb.component';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Course, Quiz } from '../../../lib/structs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { LivequizStorageService } from '../../services/livequiz-storage.service';
import { QuizID } from '../../../lib/ids';
import { StorageService } from '../../services/storage.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-edit-quiz',
  standalone: true,
  imports: [TextFieldModule, FormsModule, MatButtonModule],
  templateUrl: './edit-quiz.component.html',
  styleUrl: './edit-quiz.component.scss'
})
export class EditQuizComponent {
  @Input() quizId?: string;
  @Input() course!: Course;
  text = exampleQuiz;
  compilation = "";

  constructor(private bcs: BreadcrumbService, private router: Router,
    private route: ActivatedRoute, private livequiz: LivequizStorageService,
    private storage: StorageService, private user: UserService) { }

  async ngOnInit() {
    if (this.quizId) {
      this.bcs.push('Edit Quiz', `editQuiz/${this.quizId}`)
      const quiz = await this.livequiz.getQuiz(QuizID.fromHex(this.quizId!));
      this.text = quiz.toText();
    } else {
      this.bcs.push('Create Quiz', 'createQuiz');
    }
    this.compile();
  }

  ngOnDestroy() {
    this.bcs.pop();
  }

  compile() {
    try {
      const q = Quiz.fromStr(this.text);
      this.compilation = `<h2>${q.title}</h2>` + q.questions.map((q, i) => `<h3>${i}) ${q.title}</h3>`).join("\n");
    } catch (e) {
      this.compilation = `Error while creating quiz:\n${e}`;
    }
  }

  async save() {
    if (this.quizId) {
      const quiz = await this.livequiz.getQuiz(QuizID.fromHex(this.quizId!));
      quiz.json = Quiz.fromStr(this.text).toJson();
      quiz.update();
    } else {
      const quiz = Quiz.fromStr(this.text);
      quiz.owner = this.user.id;
      this.storage.addNomads(quiz);
      this.course.quizIds.push(quiz.id);
    }
    this.cancel();
  }

  cancel(){
    this.router.navigate([this.quizId ? '../..' : '..'], { relativeTo: this.route });
  }
}

const exampleQuiz = `# Title of Quiz

; Lines starting with a ";" are comments and ignored.
## Title of first question

Introduction to the question.
This can go over multiple lines.

; Number of correct answers
= 1
- Correct answer
- A first wrong answer
- A second wrong answer

Some explanation which will only be showed during the corrections.
It can also be empty.

## Title of second question

Some more introduction to the second question.

; Replace double-space with single spaces.
; There can be more than one replace pattern.
~ s/ +/ /g
- simple match
- /regexp match/i

And another explanation.
`;