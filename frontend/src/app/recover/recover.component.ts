import { Component } from '@angular/core';
import { User, UserService } from '../services/user.service';
import { Secret } from '../../lib/ids';
import { StorageService } from '../services/storage.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recover',
  standalone: true,
  imports: [],
  template: '',
})
export class RecoverComponent {
  constructor(private user: UserService, private storage: StorageService,
    private router: Router) { }

  async ngOnInit() {
    try {
      await this.user.recover(Secret.from_hex(window.location.hash.slice(1)), this.storage);
    } catch (e) {
      console.error(e);
    }
    this.router.navigate(['/']);
  }
}
