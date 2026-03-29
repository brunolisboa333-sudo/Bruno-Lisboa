import { useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  deleteDoc,
  doc, 
  query, 
  where
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from '../firebase';
import { Patient, Appointment, SessionRecord, Expense, ClinicSettings, UserProfile } from '../types';
import { toast } from 'sonner';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const cleanData = (data: any) => {
  return JSON.parse(JSON.stringify(data));
};

export function useStorage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settings, setSettings] = useState<ClinicSettings>({
    clinicName: 'Clínica de Psicanálise',
    professionalName: 'Bruno Lisboa',
    professionalInitials: 'BL',
    specialty: 'Psicanalista',
    defaultSessionValue: 150
  });
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Cleanup previous profile listener if it exists
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (!currentUser) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      // Fetch or create user profile
      const userRef = doc(db, 'users', currentUser.uid);
      unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
        if (snapshot.exists()) {
          setUserProfile(snapshot.data() as UserProfile);
          setLoading(false);
        } else {
          // Create initial profile
          try {
            const isAdmin = currentUser.email === 'brunolisboa333@gmail.com';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || undefined,
              role: isAdmin ? 'admin' : 'member',
              status: isAdmin ? 'authorized' : 'pending',
              createdAt: new Date().toISOString()
            };
            await setDoc(userRef, cleanData(newProfile));
            // Snapshot listener will fire again, but let's be safe
            setUserProfile(newProfile);
            setLoading(false);
          } catch (err) {
            console.error("Error creating user profile:", err);
            setError("Erro ao criar perfil de usuário. Verifique as permissões.");
            setLoading(false);
          }
        }
      }, (err) => {
        console.error("Profile listener error:", err);
        // We don't throw here to avoid crashing the app, but we log it for the system
        const errInfo = {
          error: err.message,
          operationType: OperationType.GET,
          path: `users/${currentUser.uid}`,
          authInfo: { userId: currentUser.uid, email: currentUser.email }
        };
        console.error('Firestore Error: ', JSON.stringify(errInfo));
        setError("Erro de permissão ao acessar perfil de usuário.");
        setLoading(false);
      });
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  useEffect(() => {
    if (!user || userProfile?.status !== 'authorized') {
      setPatients([]);
      setAppointments([]);
      setRecords([]);
      setExpenses([]);
      setAllUsers([]);
      return;
    }

    const userId = user.uid;

    // Real-time listeners
    const qPatients = query(collection(db, 'patients'), where('userId', '==', userId));
    const unsubscribePatients = onSnapshot(qPatients, (snapshot) => {
      setPatients(snapshot.docs.map(doc => doc.data() as Patient));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'patients'));

    const qAppointments = query(collection(db, 'appointments'), where('userId', '==', userId));
    const unsubscribeAppointments = onSnapshot(qAppointments, (snapshot) => {
      setAppointments(snapshot.docs.map(doc => doc.data() as Appointment));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'appointments'));

    const qRecords = query(collection(db, 'records'), where('userId', '==', userId));
    const unsubscribeRecords = onSnapshot(qRecords, (snapshot) => {
      setRecords(snapshot.docs.map(doc => doc.data() as SessionRecord));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'records'));

    const qExpenses = query(collection(db, 'expenses'), where('userId', '==', userId));
    const unsubscribeExpenses = onSnapshot(qExpenses, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => doc.data() as Expense));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'expenses'));

    const settingsDoc = doc(db, 'settings', userId);
    const unsubscribeSettings = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        setSettings(snapshot.data() as ClinicSettings);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `settings/${userId}`));

    // If admin, fetch all users
    let unsubscribeAllUsers = () => {};
    if (userProfile.role === 'admin') {
      const qUsers = collection(db, 'users');
      unsubscribeAllUsers = onSnapshot(qUsers, (snapshot) => {
        setAllUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'users'));
    }

    return () => {
      unsubscribePatients();
      unsubscribeAppointments();
      unsubscribeRecords();
      unsubscribeExpenses();
      unsubscribeSettings();
      unsubscribeAllUsers();
    };
  }, [user, userProfile]);

  const updateUserProfile = async (uid: string, updates: Partial<UserProfile>) => {
    if (!user || userProfile?.role !== 'admin') return;
    try {
      await setDoc(doc(db, 'users', uid), cleanData(updates), { merge: true });
      toast.success('Perfil de usuário atualizado');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
    }
  };

  const addPatient = async (patient: Patient, silent = false) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'patients', patient.id), cleanData({ ...patient, userId: user.uid }));
      if (!silent) toast.success('Paciente cadastrado com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${patient.id}`);
    }
  };

  const updatePatient = async (id: string, data: Partial<Patient>, silent = false) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'patients', id), cleanData({ ...data, updatedAt: new Date().toISOString() }), { merge: true });
      if (!silent) toast.success('Paciente atualizado com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${id}`);
    }
  };

  const addAppointment = async (appointment: Appointment, silent = false) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'appointments', appointment.id), cleanData({ ...appointment, userId: user.uid }));
      if (!silent) toast.success('Consulta agendada com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${appointment.id}`);
    }
  };

  const updateAppointment = async (id: string, data: Partial<Appointment>, silent = false) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'appointments', id), cleanData({ ...data }), { merge: true });
      if (!silent) toast.success('Consulta atualizada com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `appointments/${id}`);
    }
  };

  const addRecord = async (record: SessionRecord, silent = false) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'records', record.id), cleanData({ ...record, userId: user.uid }));
      if (!silent) toast.success('Evolução salva com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `records/${record.id}`);
    }
  };

  const updateRecord = async (id: string, data: Partial<SessionRecord>, silent = false) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'records', id), cleanData({ ...data }), { merge: true });
      if (!silent) toast.success('Evolução atualizada com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `records/${id}`);
    }
  };

  const addExpense = async (expense: Expense, silent = false) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'expenses', expense.id), cleanData({ ...expense, userId: user.uid }));
      if (!silent) toast.success('Despesa cadastrada com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `expenses/${expense.id}`);
    }
  };

  const updateExpense = async (id: string, data: Partial<Expense>, silent = false) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'expenses', id), cleanData({ ...data }), { merge: true });
      if (!silent) toast.success('Despesa atualizada com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `expenses/${id}`);
    }
  };

  const saveSettings = async (newSettings: ClinicSettings) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'settings', user.uid), cleanData(newSettings));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `settings/${user.uid}`);
    }
  };

  const deletePatient = async (id: string, silent = false) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'patients', id));
      if (!silent) toast.success('Paciente excluído com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `patients/${id}`);
    }
  };

  const deleteAppointment = async (id: string, silent = false) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'appointments', id));
      if (!silent) toast.success('Agendamento excluído com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `appointments/${id}`);
    }
  };

  const deleteRecord = async (id: string, silent = false) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'records', id));
      if (!silent) toast.success('Evolução excluída com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `records/${id}`);
    }
  };

  const deleteExpense = async (id: string, silent = false) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'expenses', id));
      if (!silent) toast.success('Despesa excluída com sucesso');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `expenses/${id}`);
    }
  };

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      throw error; // Throw so the UI can handle it
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return {
    patients,
    appointments,
    records,
    expenses,
    settings,
    user,
    userProfile,
    allUsers,
    loading,
    error,
    addPatient,
    updatePatient,
    addAppointment,
    updateAppointment,
    addRecord,
    updateRecord,
    addExpense,
    updateExpense,
    saveSettings,
    deletePatient,
    deleteAppointment,
    deleteRecord,
    deleteExpense,
    updateUserProfile,
    login,
    logout
  };
}
