import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export const createStudent = async (email, password, rollNumber) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: email,
      rollNumber: rollNumber,
      createdAt: new Date()
    });
    return true;
  } catch (error) {
    throw error;
  }
};