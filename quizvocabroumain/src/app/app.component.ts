import { Component, OnInit } from '@angular/core';
import { QuizvocabroumainService } from './services/quizvocabroumain.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  listTest : any[];

  currentQuestion : string;
  currentAnswer : string;
  currentIndex : number;
  previousQuestion : string;
  previousAnswer : string;
  previousAnswerRightAnswer : string;

  constructor(private quizVocabRoumainService: QuizvocabroumainService) {
  }

  ngOnInit()
  {    
    // c'est ici que l'on set la liste du vocabulaire local
    this.listTest = this.quizVocabRoumainService.getListe();
    this.currentIndex = 0;
    this.currentQuestion = this.listTest[this.currentIndex].fr;
  }

  submitResponse() {
    // on rempli les champs previous
    this.previousAnswer=this.currentAnswer;
    this.previousQuestion=this.currentQuestion;
    this.previousAnswerRightAnswer=this.listTest[this.currentIndex].ro;
    
    // on passe a la question suivante
    this.currentIndex++;
    this.currentAnswer = '';
    this.currentQuestion = this.listTest[this.currentIndex].fr;
  }
}
