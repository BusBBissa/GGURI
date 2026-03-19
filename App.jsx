import React, { useState, useEffect } from "react"; import { initializeApp } from "firebase/app"; import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth"; import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = { apiKey: "AIzaSyBzMM4swUjS08WjOqSF7RmfaHOsfVc8gSg", authDomain: "gguri-e94ae.firebaseapp.com", projectId: "gguri-e94ae", };

const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app); const provider = new GoogleAuthProvider();

export default function App() { const [user, setUser] = useState(null); const [coupleId, setCoupleId] = useState("");

const [tab, setTab] = useState("tasks");

const [tasks, setTasks] = useState([]); const [taskText, setTaskText] = useState(""); const [category, setCategory] = useState("스드메");

const [budgetItems, setBudgetItems] = useState([]); const [budgetName, setBudgetName] = useState(""); const [budgetCost, setBudgetCost] = useState("");

const [guests, setGuests] = useState([]); const [guestName, setGuestName] = useState("");

useEffect(() => { onAuthStateChanged(auth, (u) => u && setUser(u)); }, []);

useEffect(() => { if (!coupleId) return; const load = async () => { const snap = await getDoc(doc(db, "couples", coupleId)); if (snap.exists()) { const d = snap.data(); setTasks(d.tasks || []); setBudgetItems(d.budgetItems || []); setGuests(d.guests || []); } }; load(); }, [coupleId]);

useEffect(() => { if (!coupleId) return; setDoc(doc(db, "couples", coupleId), { tasks, budgetItems, guests }); }, [tasks, budgetItems, guests, coupleId]);

const login = () => signInWithPopup(auth, provider);

const totalBudget = budgetItems.reduce((a,b)=>a+b.cost,0);

if (!user) { return ( <div style={{ height:"100vh", display:"flex", justifyContent:"center", alignItems:"center" }}> <button onClick={login}>로그인</button> </div> ); }

return ( <div style={{ minHeight:"100vh", background:"#fafafa", padding:"15px" }}>

{/* 카드 공통 스타일 */}
  <style>{`
    .card {
      background: white;
      border-radius: 20px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.05);
    }
    .scroll {
      max-height: 200px;
      overflow-y: auto;
      margin-top: 10px;
    }
  `}</style>

  {/* 💰 예산 카드 */}
  <div className="card">
    <h3>💰 예산</h3>
    <h2>{totalBudget}원</h2>

    <input placeholder="항목" onChange={(e)=>setBudgetName(e.target.value)} />
    <input placeholder="금액" type="number" onChange={(e)=>setBudgetCost(e.target.value)} />
    <button onClick={()=>{
      setBudgetItems([...budgetItems,{name:budgetName,cost:+budgetCost}]);
    }}>추가</button>

    <div className="scroll">
      {budgetItems.map((b,i)=>(
        <div key={i}>{b.name} - {b.cost}</div>
      ))}
    </div>
  </div>

  {/* 👥 하객 카드 */}
  <div className="card">
    <h3>👥 하객 ({guests.length})</h3>

    <input placeholder="이름" onChange={(e)=>setGuestName(e.target.value)} />
    <button onClick={()=>setGuests([...guests,guestName])}>추가</button>

    <div className="scroll">
      {guests.map((g,i)=>(<div key={i}>{g}</div>))}
    </div>
  </div>

  {/* ✅ 할일 카드 */}
  <div className="card">
    <h3>✅ 할일</h3>

    <select onChange={(e)=>setCategory(e.target.value)}>
      <option>스드메</option>
      <option>웨딩홀</option>
      <option>신혼여행</option>
      <option>예물</option>
      <option>혼수</option>
    </select>

    <input value={taskText} onChange={(e)=>setTaskText(e.target.value)} placeholder="할 일 입력" />
    <button onClick={()=>{
      setTasks([...tasks,{text:taskText,category,done:false}]);
      setTaskText("");
    }}>추가</button>

    <div className="scroll">
      {Object.entries(
        tasks.reduce((acc,t)=>{
          acc[t.category] = acc[t.category] || [];
          acc[t.category].push(t);
          return acc;
        },{})
      ).map(([cat,list])=> (
        <div key={cat}>
          <b>📂 {cat}</b>
          {list.map((t,i)=>(
            <div key={i} style={{ display:"flex", justifyContent:"space-between" }}>
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>

</div>

); }