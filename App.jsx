import React, { useState, useEffect, useMemo } from "react";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg",
  authDomain: "gguri-e94ae.firebaseapp.com",
  projectId: "gguri-e94ae",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export default function App() {
  const [user, setUser] = useState(null);
  const [coupleId, setCoupleId] = useState("");
  const [inputCoupleId, setInputCoupleId] = useState("");

  const [guests, setGuests] = useState([]);
  const [guestName, setGuestName] = useState("");

  const [items, setItems] = useState([]);
  const [itemName, setItemName] = useState("");
  const [itemCost, setItemCost] = useState("");
  const [budgetLimit, setBudgetLimit] = useState(0);

  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [assignee, setAssignee] = useState("신랑");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
    });
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const ref = doc(db, "couples", coupleId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setGuests(data.guests || []);
        setItems(data.items || []);
        setTasks(data.tasks || []);
        setBudgetLimit(data.budgetLimit || 0);
      }
    };
    load();
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;
    const ref = doc(db, "couples", coupleId);
    setDoc(ref, { guests, items, tasks, budgetLimit });
  }, [guests, items, tasks, budgetLimit, coupleId]);

  const login = async () => {
    await signInWithPopup(auth, provider);
  };

  const createCouple = () => {
    const id = Math.random().toString(36).substring(2, 8);
    setCoupleId(id);
  };

  const joinCouple = () => {
    setCoupleId(inputCoupleId);
  };

  const addGuest = () => {
    if (!guestName) return;
    setGuests([...guests, { name: guestName, attending: false }]);
    setGuestName("");
  };

  const toggleGuest = (i) => {
    const updated = [...guests];
    updated[i].attending = !updated[i].attending;
    setGuests(updated);
  };

  const attendingCount = useMemo(
    () => guests.filter((g) => g.attending).length,
    [guests]
  );

  const addItem = () => {
    if (!itemName || !itemCost) return;
    setItems([...items, { name: itemName, cost: Number(itemCost) }]);
    setItemName("");
    setItemCost("");
  };

  const totalCost = useMemo(
    () => items.reduce((sum, i) => sum + i.cost, 0),
    [items]
  );

  const isOverBudget = totalCost > budgetLimit;

  const addTask = () => {
    if (!taskText) return;
    setTasks([
      ...tasks,
      { text: taskText, done: false, assignedTo: assignee },
    ]);
    setTaskText("");
  };

  const toggleTask = (i) => {
    const updated = [...tasks];
    updated[i].done = !updated[i].done;
    setTasks(updated);
  };

  if (!user) {
    return (
      <div style={{ background: "black", color: "white", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <button onClick={login}>Google 로그인</button>
      </div>
    );
  }

  if (!coupleId) {
    return (
      <div style={{ background: "black", color: "white", height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: "10px" }}>
        <button onClick={createCouple}>커플 코드 생성</button>
        <input value={inputCoupleId} onChange={(e) => setInputCoupleId(e.target.value)} placeholder="코드 입력" />
        <button onClick={joinCouple}>입장</button>
      </div>
    );
  }

  return (
    <div style={{ background: "black", color: "white", minHeight: "100vh", padding: "20px" }}>
      <h1>Wedding Planner</h1>
      <div>커플 코드: {coupleId}</div>

      <h2>하객 ({attendingCount})</h2>
      <input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
      <button onClick={addGuest}>추가</button>
      {guests.map((g, i) => (
        <div key={i}>
          {g.name}
          <button onClick={() => toggleGuest(i)}>✔</button>
        </div>
      ))}

      <h2>예산</h2>
      <input type="number" placeholder="총 예산" onChange={(e) => setBudgetLimit(Number(e.target.value))} />
      <div>총 사용: {totalCost}원</div>
      {isOverBudget && <div>⚠️ 예산 초과</div>}
      <input value={itemName} onChange={(e) => setItemName(e.target.value)} />
      <input type="number" value={itemCost} onChange={(e) => setItemCost(e.target.value)} />
      <button onClick={addItem}>추가</button>

      <h2>할 일</h2>
      <input value={taskText} onChange={(e) => setTaskText(e.target.value)} />
      <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
        <option>신랑</option>
        <option>신부</option>
      </select>
      <button onClick={addTask}>추가</button>

      {tasks.map((t, i) => (
        <div key={i}>
          [{t.assignedTo}] {t.text} {t.done ? "✅" : "⬜"}
          <button onClick={() => toggleTask(i)}>완료</button>
        </div>
      ))}
    </div>
  );
}