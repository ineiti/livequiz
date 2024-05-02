import { Component } from '@angular/core';
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-reset',
  standalone: true,
  imports: [],
  template: "",
})
export class ResetComponent {
  constructor(storage: StorageService, router: Router){
    storage.reset();
    router.navigate(["/"]);
  }
}
