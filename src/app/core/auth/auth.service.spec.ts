import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService, type CurrentUser } from './auth.service';
import { environment } from '../../../environments/environment';

const USER: CurrentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'a@b.io',
  is_active: true,
  is_superuser: false,
  is_verified: true,
  timezone_name: 'Europe/Brussels',
};

describe('AuthService remember-me', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'login', children: [] }]),
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  async function flushLogin(remember: boolean): Promise<void> {
    const p = service.login('a@b.io', 'pw', remember);
    const loginReq = http.expectOne(`${environment.apiBaseUrl}/auth/jwt/login`);
    expect(loginReq.request.method).toBe('POST');
    expect(loginReq.request.headers.get('Content-Type')).toBe(
      'application/x-www-form-urlencoded',
    );
    expect(loginReq.request.body).toBe('username=a@b.io&password=pw');
    loginReq.flush({ access_token: 'acc', refresh_token: 'ref', token_type: 'bearer' });
    // Let the login promise resolve so refreshCurrentUser() issues the /users/me GET.
    await Promise.resolve();
    await Promise.resolve();
    http.expectOne(`${environment.apiBaseUrl}/users/me`).flush(USER);
    await p;
  }

  it('persists refresh in localStorage when remember=true', async () => {
    await flushLogin(true);
    expect(service.token()).toBe('acc');
    expect(service.currentUser()).toEqual(USER);
    expect(service.isLoggedIn()).toBe(true);
    expect(localStorage.getItem('fox.refresh')).toBe('ref');
    expect(sessionStorage.getItem('fox.refresh')).toBeNull();
    expect(service.hasStoredRefresh()).toBe(true);
  });

  it('uses sessionStorage when remember=false', async () => {
    await flushLogin(false);
    expect(sessionStorage.getItem('fox.refresh')).toBe('ref');
    expect(localStorage.getItem('fox.refresh')).toBeNull();
    expect(service.hasStoredRefresh()).toBe(true);
  });

  it('refresh() swaps the access token and persists the rotated refresh', async () => {
    await flushLogin(true);
    const p = service.refresh();
    const req = http.expectOne(`${environment.apiBaseUrl}/auth/jwt/refresh`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ refresh: 'ref' });
    req.flush({ access: 'acc2', refresh: 'ref2' });
    expect(await p).toBe('acc2');
    expect(service.token()).toBe('acc2');
    expect(localStorage.getItem('fox.refresh')).toBe('ref2');
  });

  it('logout posts the stored refresh then clears both storages', async () => {
    await flushLogin(true);
    const p = service.logout();
    const req = http.expectOne(`${environment.apiBaseUrl}/auth/jwt/logout`);
    expect(req.request.body).toEqual({ refresh: 'ref' });
    req.flush({ status: 'ok' });
    await p;
    expect(service.token()).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(service.isLoggedIn()).toBe(false);
    expect(service.hasStoredRefresh()).toBe(false);
  });

  it('clear() drops the token and the stored refresh', async () => {
    await flushLogin(false);
    service.clear();
    expect(service.token()).toBeNull();
    expect(service.hasStoredRefresh()).toBe(false);
  });
});
