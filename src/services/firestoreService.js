// src/services/firestoreService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Books ───────────────────────────────────────────────────────────────────

export const getBooks = async () => {
  const snap = await getDocs(collection(db, 'books'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const subscribeBooks = (callback) =>
  onSnapshot(collection(db, 'books'), (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );

// ─── Loans ────────────────────────────────────────────────────────────────────

export const subscribeLoans = (callback) =>
  onSnapshot(collection(db, 'loans'), (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );

export const subscribeUserLoans = (uid, callback) => {
  const q = query(collection(db, 'loans'), where('userId', '==', uid));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const createLoanRequest = async (loanData) => {
  return addDoc(collection(db, 'loans'), {
    ...loanData,
    status: 'Pending',
    createdAt: serverTimestamp(),
  });
};

export const updateLoan = async (loanId, data) => {
  return updateDoc(doc(db, 'loans', loanId), data);
};

// ─── Wishlist ─────────────────────────────────────────────────────────────────

export const subscribeWishlist = (uid, callback) => {
  const q = query(collection(db, 'wishlist'), where('userId', '==', uid));
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
};

export const addToWishlist = async (uid, bookId, bookTitle) => {
  return addDoc(collection(db, 'wishlist'), {
    userId: uid,
    bookId,
    bookTitle,
    createdAt: serverTimestamp(),
  });
};

export const removeFromWishlist = async (wishlistDocId) => {
  return deleteDoc(doc(db, 'wishlist', wishlistDocId));
};

// ─── User Profiles ────────────────────────────────────────────────────────────

export const getBorrowerDisplayName = async (uid, fallbackEmail) => {
  const st = await getDoc(doc(db, 'students', uid));
  if (st.exists()) return st.data()?.name || fallbackEmail || 'User';
  const dr = await getDoc(doc(db, 'doctors', uid));
  if (dr.exists()) return dr.data()?.name || fallbackEmail || 'User';
  return fallbackEmail || 'User';
};

export const updateUserProfile = async (uid, role, data) => {
  const col = role === 'doctor' ? 'doctors' : 'students';
  return updateDoc(doc(db, col, uid), data);
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const getAllStudents = async () => {
  const snap = await getDocs(collection(db, 'students'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllDoctors = async () => {
  const snap = await getDocs(collection(db, 'doctors'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllLoans = async () => {
  const snap = await getDocs(collection(db, 'loans'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ─── Faculty Book Submissions ─────────────────────────────────────────────────

export const submitBookRequest = async (data) => {
  return addDoc(collection(db, 'book_requests'), {
    ...data,
    status: 'Pending',
    createdAt: serverTimestamp(),
  });
};

export const subscribeFacultyRequests = (callback) =>
  onSnapshot(collection(db, 'book_requests'), (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
