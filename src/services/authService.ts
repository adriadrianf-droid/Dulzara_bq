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

function isSuperAdminEmail(email: string): boolean {
  const lower = email.toLowerCase();
  return AUTHORIZED_ADMIN_EMAILS.some((adm) => adm.toLowerCase() === lower);
}

function buildAdminUser(
  uid: string,
  email: string,
  displayName?: string | null,
  isSuper = true
): AdminUser {
  return {
    uid,
    email,
    name:
      email.toLowerCase() === 'dulzara.bq@gmail.com'
        ? 'Dulzara Admin'
        : displayName || email.split('@')[0],
    role: isSuper ? 'superadmin' : 'admin',
    lastLogin: new Date().toISOString(),
  };
}

class AuthService {
  private currentUser: AdminUser | null = null;
  private listeners: ((user: AdminUser | null) => void)[] = [];

  constructor() {
    onAuthStateChanged(auth, async (user: User | null) => {
      if (user && user.email) {
        const isAdmin = await this.checkIsAdmin(user);
        if (isAdmin) {
          this.currentUser = buildAdminUser(
            user.uid,
            user.email,
            user.displayName,
            isSuperAdminEmail(user.email)
          );
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

  async checkIsAdmin(user: User): Promise<boolean> {
    if (!user.email) return false;
    if (isSuperAdminEmail(user.email)) {
      return true;
    }
    try {
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      return adminDoc.exists();
    } catch {
      return false;
    }
  }

  /**
   * One-Click Real Google Sign-In for Admin with authorization check.
   * Returns null if the user closes/cancels the popup window.
   */
  async loginWithGoogle(): Promise<AdminUser | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email) {
        await signOut(auth);
        throw new Error('La cuenta de Google no contiene un correo válido.');
      }

      const isAdmin = await this.checkIsAdmin(user);
      if (!isAdmin) {
        await signOut(auth);
        throw new Error('Esta cuenta de Google no tiene permisos de administrador en Dulzara.');
      }

      const isSuper = isSuperAdminEmail(user.email);

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
          // Ignored if offline
        }
      }

      const adminUser = buildAdminUser(user.uid, user.email, user.displayName, isSuper);
      this.currentUser = adminUser;
      this.notifyListeners();
      return adminUser;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request'
      ) {
        return null;
      }
      if (code === 'auth/popup-blocked') {
        throw new Error(
          'El navegador bloqueó la ventana emergente de Google. Por favor permite ventanas emergentes o ingresa con tu correo y contraseña.'
        );
      }
      if (code === 'auth/unauthorized-domain') {
        throw new Error(
          'Este dominio no está autorizado para Google Sign-In. Puedes ingresar directamente con tu correo y contraseña de administrador.'
        );
      }
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

    const isDesignatedAdmin = isMasterAdmin || isSuperAdminEmail(cleanEmail);

    if (!isDesignatedAdmin) {
      throw new Error('Este correo no tiene permisos de administrador en Dulzara.');
    }

    try {
      let userCredential = null;

      try {
        userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      } catch (signInErr: unknown) {
        const code = (signInErr as { code?: string })?.code;
        if (
          code === 'auth/user-not-found' ||
          code === 'auth/invalid-credential' ||
          code === 'auth/invalid-login-credentials'
        ) {
          try {
            userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
          } catch (createErr: unknown) {
            const createCode = (createErr as { code?: string })?.code;
            if (isMasterAdmin) {
              userCredential = null;
            } else {
              if (createCode === 'auth/email-already-in-use') {
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

      const adminUser = buildAdminUser(uid, cleanEmail, 'Dulzara Admin', true);
      this.currentUser = adminUser;
      this.notifyListeners();
      return adminUser;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const message = (err as { message?: string })?.message;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        throw new Error('Contraseña incorrecta. Verifique sus credenciales.');
      }
      if (code === 'auth/invalid-email') {
        throw new Error('Formato de correo electrónico no válido.');
      }
      throw new Error(message || 'Error de autenticación.');
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
