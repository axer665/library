'use client';

import { makeAutoObservable, runInAction } from 'mobx';
import { api } from '@/lib/api';

export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
}

class AuthStore {
  user: User | null = null;
  token: string | null = null;
  loading = false;
  initialized = false;

  constructor() {
    makeAutoObservable(this);
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token');
    }
  }

  async init() {
    if (this.initialized || !this.token) {
      this.initialized = true;
      return;
    }
    this.loading = true;
    try {
      const user = await api.auth.me();
      runInAction(() => {
        this.user = user;
        this.initialized = true;
      });
    } catch {
      runInAction(() => {
        this.token = null;
        this.user = null;
        this.initialized = true;
        if (typeof window !== 'undefined') localStorage.removeItem('token');
      });
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async syncUserFromApi() {
    if (!this.token) return;
    try {
      const user = await api.auth.me();
      runInAction(() => {
        this.user = user;
      });
    } catch {
      if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
        runInAction(() => {
          this.token = null;
          this.user = null;
        });
      }
    }
  }

  async login(email: string, password: string) {
    this.loading = true;
    try {
      const { user, access_token } = await api.auth.login({ email, password });
      runInAction(() => {
        this.user = user;
        this.token = access_token;
        if (typeof window !== 'undefined') localStorage.setItem('token', access_token);
      });
      return true;
    } catch (e) {
      throw e;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async register(name: string, email: string, password: string) {
    this.loading = true;
    try {
      const { user, access_token } = await api.auth.register({
        name,
        email,
        password,
        password_confirmation: password,
      });
      runInAction(() => {
        this.user = user;
        this.token = access_token;
        if (typeof window !== 'undefined') localStorage.setItem('token', access_token);
      });
      return true;
    } catch (e) {
      throw e;
    } finally {
      runInAction(() => (this.loading = false));
    }
  }

  async logout() {
    try {
      await api.auth.logout();
    } catch {}
    runInAction(() => {
      this.user = null;
      this.token = null;
      if (typeof window !== 'undefined') localStorage.removeItem('token');
    });
  }

  get isAuthenticated() {
    return !!this.token;
  }

  get isEmailVerified() {
    return !!this.user?.email_verified_at;
  }
}

export const authStore = new AuthStore();
