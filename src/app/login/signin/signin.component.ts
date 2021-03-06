import { Component, Injectable, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SIGNIN_TOKEN } from 'src/app/app.constants';
import { User } from 'src/app/list-users/list-users.component';
import { RoleService } from 'src/app/role/role.service';
import { FIRST_NAME, LAST_NAME, StorageService, TODO_LIST, USER_ROLE } from 'src/app/service/data/storage.service';
import { UserDataService } from 'src/app/service/data/user-data.service';
import { PreloginService } from 'src/app/service/prelogin.service';
import { BasicAuthenticationService } from '../../service/basic-authentication.service';
import { UserService } from 'src/app/service/user.service';
import { concatMap, map } from 'rxjs/operators';
import { TodoDataService } from 'src/app/service/data/todo-data.service';


@Injectable({
  providedIn: 'root'
})
@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss']
})
export class SigninComponent implements OnInit {
  signinForm: FormGroup;
  email: string;
  password: "";
  hide=true;
  invalidLogin = false;
  submitted=false;
  user: User;

  constructor(private preLoginService: PreloginService,
              fb: FormBuilder,
              private router: Router,
              private basicAuthenticationService: BasicAuthenticationService,
              private userDataService: UserDataService,
              private todoDataService: TodoDataService,
              private userService: UserService,
              private roleService: RoleService,
              private storageService: StorageService) {
    this.signinForm = fb.group({
      'email':['', Validators.required],
      'password':['', Validators.required]
    });

    this.email = this.signinForm.controls['email'].value;
    this.password = this.signinForm.controls['password'].value;

    //ensure that the next accessed page has a matching token
    this.preLoginService.receivedToken = SIGNIN_TOKEN;
  }

  ngOnInit(): void {
  }

  onSubmit(): any {
    this.email = this.signinForm.controls['email'].value;
    this.password = this.signinForm.controls['password'].value;

    // Verify user and add all user info (user name, todos, etc) to storage when signing in. 
    this.basicAuthenticationService.executeJWTAuthenticationService(this.email, this.password).pipe(
      concatMap(data =>
        this.userDataService.retrieveUserByEmail(this.email).pipe(
          map(response => this.user = response)
        )
      ),
      concatMap(data => this.todoDataService.getTodoData(this.email).pipe(
        map(response => this.storageService.setStorageItem(TODO_LIST, response))
      ))
    ).subscribe(
      response => {
        this.storageService.setStorageItem(FIRST_NAME, this.user.firstName);
        this.storageService.setStorageItem(LAST_NAME, this.user.lastName);
        this.storageService.setStorageItem(USER_ROLE, this.userService.getUserRole(this.user.roles, this.roleService.appRoles));
        this.router.navigate(['home']);
        this.invalidLogin = false;
      },
      error => {
        this.invalidLogin = true;
        this.submitted = true;
      }
    )
  }

}
