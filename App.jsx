import React, { useState, useEffect, useMemo } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

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
  const [category, setCategory] = useState("웨딩홀");
  const [budgetLimit, setBudgetLimit] = useState(0);

  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [assignee, setAssignee] = useState("같이");

  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [eventDate, setEventDate] = useState("");

  const [memo, setMemo] = useState("");
  const [weddingDate, setWeddingDate] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => u && setUser(u));
  }, []);

  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setGuests(d.guests || []);
        setItems(d.items || []);
        setTasks(d.tasks || []);
        setEvents(d.events || []);
        setMemo(d.memo || "");
        setBudgetLimit(d.budgetLimit || 0);
        setWeddingDate(d.weddingDate || "");
      }
    };
    load();
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;
    setDoc(doc(db, "couples", coupleId), {
      guests, items, tasks, events, memo, budgetLimit, weddingDate
    });
  }, [guests, items, tasks, events, memo, budgetLimit, weddingDate, coupleId]);

  useEffect(() => {
    if (tasks.length === 0 && coupleId) {
      setTasks([
        { text: "웨딩홀 계약", done: false, who: "같이" },
        { text: "스드메 예약", done: false, who: "같이" },
        { text: "청첩장 제작", done: false, who: "신부" },
        { text: "신혼여행 예약", done: false, who: "신랑" },
      ]);
    }
  }, [coupleId]);

  const login = () => signInWithPopup(auth, provider);

  const createCouple = () => setCoupleId(Math.random().toString(36).slice(2, 8));
  const joinCouple = () => setCoupleId(inputCoupleId);

  const totalCost = useMemo(() => items.reduce((a, b) => a + b.cost, 0), [items]);
  const progress = useMemo(() => tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0, [tasks]);

  const dday = useMemo(() => {
    if (!weddingDate) return null;
    return Math.ceil((new Date(weddingDate) - new Date()) / (1000*60*60*24));
  }, [weddingDate]);

  const card = {
    background: "white",
    padding: "16px",
    borderRadius: "16px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
    marginBottom: "16px"
  };

  if (!user) return <button onClick={login}>Google 로그인</button>;

  if (!coupleId) return (
    <div>
      <button onClick={createCouple}>커플 생성</button>
      <input onChange={(e)=>setInputCoupleId(e.target.value)} />
      <button onClick={joinCouple}>입장</button>
    </div>
  );

  return (
    <div style={{ background:"#f5f5f5", padding:"20px", minHeight:"100vh" }}>
      
      <div style={card}>
        <h2>D-Day {dday ? `D-${dday}` : "설정 필요"}</h2>
        <input type="date" onChange={(e)=>setWeddingDate(e.target.value)} />
        <div>진행률: {progress}%</div>
      </div>

      <div style={card}>
        <h2>하객</h2>
        <input value={guestName} onChange={e=>setGuestName(e.target.value)} />
        <button onClick={()=>{setGuests([...guests,{name:guestName,att:false}]);setGuestName("")}}>추가</button>
        {guests.map((g,i)=>(
          <div key={i}>
            {g.name}
            <button onClick={()=>{let x=[...guests];x[i].att=!x[i].att;setGuests(x)}}>✔</button>
            <button onClick={()=>setGuests(guests.filter((_,idx)=>idx!==i))}>❌</button>
          </div>
        ))}
      </div>

      <div style={card}>
        <h2>예산</h2>
        <input placeholder="총 예산" onChange={e=>setBudgetLimit(+e.target.value)} />
        <div>총: {totalCost}</div>
        {totalCost>budgetLimit && <div>⚠️ 초과</div>}
        <select onChange={e=>setCategory(e.target.value)}>
          <option>웨딩홀</option><option>스드메</option><option>예물</option><option>혼수</option>
        </select>
        <input value={itemName} onChange={e=>setItemName(e.target.value)} />
        <input value={itemCost} onChange={e=>setItemCost(e.target.value)} />
        <button onClick={()=>{setItems([...items,{name:itemName,cost:+itemCost,category}]);setItemName("");setItemCost("")}}>추가</button>
      </div>

      <div style={card}>
        <h2>할 일</h2>
        <input value={taskText} onChange={e=>setTaskText(e.target.value)} />
        <select onChange={e=>setAssignee(e.target.value)}>
          <option>신랑</option><option>신부</option><option>같이</option>
        </select>
        <button onClick={()=>setTasks([...tasks,{text:taskText,done:false,who:assignee}])}>추가</button>

        {tasks.map((t,i)=>(
          <div key={i}>
            [{t.who}] {t.text}
            <button onClick={()=>{let x=[...tasks];x[i].done=!x[i].done;setTasks(x)}}>✔</button>
            <button onClick={()=>setTasks(tasks.filter((_,idx)=>idx!==i))}>❌</button>
          </div>
        ))}
      </div>

      <div style={card}>
        <h2>일정</h2>
        <input onChange={e=>setEventText(e.target.value)} />
        <input type="date" onChange={e=>setEventDate(e.target.value)} />
        <button onClick={()=>setEvents([...events,{text:eventText,date:eventDate}])}>추가</button>
        {events.map((e,i)=>(<div key={i}>{e.text} - {e.date}</div>))}
      </div>

      <div style={card}>
        <h2>메모</h2>
        <textarea value={memo} onChange={e=>setMemo(e.target.value)} style={{width:"100%"}}/>
      </div>

    </div>
  );
}