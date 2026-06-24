import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Task, Habit, Goal } from '../types';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

const provider = new GoogleAuthProvider();
// Google Calendar scopes
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/calendar.events');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // Fallback or request sign in if token is required and not present
        if (!isSigningIn) {
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Google Sign-In with popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google provider credentials.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google authorization error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// Firestore Sync Utilities
export const saveTasksToFirestore = async (userId: string, tasks: Task[]): Promise<void> => {
  try {
    const tasksColRef = collection(db, 'users', userId, 'tasks');
    // Save in batch
    const batch = writeBatch(db);
    // Since we want to keep Firestore accurate, we overwrite or insert tasks
    for (const task of tasks) {
      const docRef = doc(tasksColRef, task.id);
      batch.set(docRef, task);
    }
    await batch.commit();
  } catch (err) {
    console.warn('Error saving tasks to firestore:', err);
  }
};

export const saveHabitsToFirestore = async (userId: string, habits: Habit[]): Promise<void> => {
  try {
    const habitsColRef = collection(db, 'users', userId, 'habits');
    const batch = writeBatch(db);
    for (const habit of habits) {
      const docRef = doc(habitsColRef, habit.id);
      batch.set(docRef, habit);
    }
    await batch.commit();
  } catch (err) {
    console.warn('Error saving habits to firestore:', err);
  }
};

export const saveGoalsToFirestore = async (userId: string, goals: Goal[]): Promise<void> => {
  try {
    const goalsColRef = collection(db, 'users', userId, 'goals');
    const batch = writeBatch(db);
    for (const goal of goals) {
      const docRef = doc(goalsColRef, goal.id);
      batch.set(docRef, goal);
    }
    await batch.commit();
  } catch (err) {
    console.warn('Error saving goals to firestore:', err);
  }
};

export const fetchUserDataFromFirestore = async (
  userId: string
): Promise<{ tasks: Task[]; habits: Habit[]; goals: Goal[] } | null> => {
  try {
    const tasksSnapshot = await getDocs(collection(db, 'users', userId, 'tasks'));
    const habitsSnapshot = await getDocs(collection(db, 'users', userId, 'habits'));
    const goalsSnapshot = await getDocs(collection(db, 'users', userId, 'goals'));

    const tasks: Task[] = [];
    tasksSnapshot.forEach((doc) => tasks.push(doc.data() as Task));

    const habits: Habit[] = [];
    habitsSnapshot.forEach((doc) => habits.push(doc.data() as Habit));

    const goals: Goal[] = [];
    goalsSnapshot.forEach((doc) => goals.push(doc.data() as Goal));

    if (tasks.length === 0 && habits.length === 0 && goals.length === 0) {
      return null;
    }

    return { tasks, habits, goals };
  } catch (err) {
    console.error('Error fetching user data from firestore:', err);
    return null;
  }
};
