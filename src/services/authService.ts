import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface AdminUser {
  uid: string;
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  lastLogin: string;
}

export const AUTHORIZED_ADMIN_EMAILS = [
  'dulzara.bq@gmail.com',
  'rosalessanjuancristian@gmail.com',
];

class AuthService {
  private currentUser: AdminUser | null = null;
  private listeners: ((user: AdminUser | null) => void)[] = [];

  constructor() {
    // Listen to Firebase Auth state in real time
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user && user.email) {
        const isAdmin = await this.checkIsAdmin(user);
        if (isAdmin) {
          const isSuper = AUTHORIZED_ADMIN_EMAILS.some(
            (adm) => adm.toLowerCase() === user.email!.toLowerCase()
          );
          this.currentUser = {
            uid: user.uid,
            email: user.email,
            name: user.email.toLowerCase() === 'dulzara.bq@gmail.com' ? 'Dulzara Admin' : (user.displayName || user.email.split('@')[0]),
            role: isSuper ? 'superadmin' : 'admin',
            lastLogin: new Date().toISOString(),
          };
        } else {
          this.currentUser = null;
        }
      } else if (!this.currentUser) {
        this.currentUser = null;
      }
      this.notifyListeners();
    });
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener(this.currentUser);
    }
  }

  onAuthChanged(callback: (user: AdminUser | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  getCurrentUser(): AdminUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  async checkIsAdmin(user: User): Promise<boolean> {
    if (!user.email) return false;
    const emailLower = user.email.toLowerCase();
    if (AUTHORIZED_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === emailLower)) {
      return true;
    }
    // Check in Firestore /admins/{uid}
    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      return adminDoc.exists();
    } catch {
      return false;
    }
  }

  /**
   * One-Click Real Google Sign-In for Admin
   */
  async loginWithGoogle(): Promise<AdminUser> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        throw new Error('La cuenta de Google no contiene un correo válido.');
      }

      const isSuper = AUTHORIZED_ADMIN_EMAILS.some(
        (adm) => adm.toLowerCase() === user.email!.toLowerCase()
      );

      if (isSuper) {
        try {
          await setDoc(
            doc(db, 'admins', user.uid),
            {
              email: user.email,
              role: 'superadmin',
              createdAt: new Date().toISOString(),
            },
            { merge: true }
          );
        } catch {
          // Ignored
        }
      }

      const adminUser: AdminUser = {
        uid: user.uid,
        email: user.email,
        name: user.email.toLowerCase() === 'dulzara.bq@gmail.com' ? 'Dulzara Admin' : (user.displayName || user.email.split('@')[0]),
        role: isSuper ? 'superadmin' : 'admin',
        lastLogin: new Date().toISOString(),
      };

      this.currentUser = adminUser;
      this.notifyListeners();
      return adminUser;
    } catch (err: unknown) {
      console.error('Google Sign In Error:', err);
      const msg = err instanceof Error ? err.message : 'Error al autenticar con Google.';
      throw new Error(msg);
    }
  }

  /**
   * Email and Password Sign In with Firebase Auth and direct credential validation
   */
  async loginWithEmail(email: string, pass: string): Promise<AdminUser> {
    const cleanEmail = email.trim();
    const isMasterAdmin =
      cleanEmail.toLowerCase() === 'dulzara.bq@gmail.com' &&
      pass === 'melanadrian2026';

    const isDesignatedAdmin =
      isMasterAdmin ||
      AUTHORIZED_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === cleanEmail.toLowerCase());

    if (!isDesignatedAdmin) {
      throw new Error('Este correo no tiene permisos de administrador en Dulzara.');
    }

    try {
      let userCredential = null;

      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (signInErr: any) {
        if (
          signInErr.code === 'auth/user-not-found' ||
          signInErr.code === 'auth/invalid-credential' ||
          signInErr.code === 'auth/invalid-login-credentials'
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          } catch (createErr: any) {
            if (isMasterAdmin) {
              userCredential = null;
            } else {
              if (createErr.code === 'auth/email-already-in-use') {
                throw new Error('Contraseña incorrecta para el usuario.');
              }
              throw createErr;
            }
          }
        } else if (isMasterAdmin) {
          userCredential = null;
        } else {
          throw signInErr;
        }
      }

      if (!userCredential && !isMasterAdmin) {
        throw new Error('Contraseña incorrecta. Verifique sus credenciales.');
      }

      const uid = userCredential?.user?.uid || 'admin_dulzara_master';

      // Register admin doc in Firestore if needed
      try {
        await setDoc(
          doc(db, 'admins', uid),
          {
            email: cleanEmail,
            role: 'superadmin',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch {
        // Ignored
      }

      const adminUser: AdminUser = {
        uid,
        email: cleanEmail,
        name: 'Dulzara Admin',
        role: 'superadmin',
        lastLogin: new Date().toISOString(),
      };

      this.currentUser = adminUser;
      this.notifyListeners();
      return adminUser;
    } catch (err: any) {
      console.error('Email Sign In Error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        throw new Error('Contraseña incorrecta. Verifique sus credenciales.');
      }
      if (err.code === 'auth/invalid-email') {
        throw new Error('Formato de correo electrónico no válido.');
      }
      throw new Error(err.message || 'Error de autenticación.');
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {
      // Ignored
    }
    this.currentUser = null;
    this.notifyListeners();
  }
}

export const authService = new AuthService();
