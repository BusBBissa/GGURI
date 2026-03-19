import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
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

  const [tab, setTab] = useState("home");

  // 사진 슬라이드
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);

  // D-day
  const [weddingDate, setWeddingDate] = useState("");

  // 달력 일정
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");

  // 할일
  const [tasks, setTasks] = useState([]);
  const [taskText, setTaskText] = useState("");
  const [category, setCategory] = useState("스드메");

  // 예산
  const [budgetItems, setBudgetItems] = useState([]);
  const [budgetName, setBudgetName] = useState("");
  const [budgetCost, setBudgetCost] = useState("");

  // 하객
  const [guests, setGuests] = useState([]);
  const [guestParent, setGuestParent] = useState("신랑");
  const [guestCategory, setGuestCategory] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestSearch, setGuestSearch] = useState("");

  useEffect(() => {
    onAuthStateChanged(auth, (u) => u && setUser(u));
  }, []);

  // Firestore load
  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setImages(d.images || []);
        setTasks(d.tasks || []);
        setEvents(d.events || []);
        setBudgetItems(d.budgetItems || []);
        setGuests(d.guests || []);
        setWeddingDate(d.weddingDate || "");
      }
    };
    load();
  }, [coupleId]);

  // Firestore save
  useEffect(() => {
    if (!coupleId) return;
    setDoc(doc(db, "couples", coupleId), { images, tasks, events, budgetItems, guests, weddingDate });
  }, [images, tasks, events, budgetItems, guests, weddingDate, coupleId]);

  // 사진 자동 슬라이드
  useEffect(() => {
    if (images.length < 2) return;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 3000); // 3초
    return () => clearInterval(interval);
  }, [images]);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  const createCouple = () => {
    const id = Math.random().toString(36).slice(2, 8);
    setCoupleId(id);
    navigator.clipboard.writeText(id);
    alert("초대 코드: " + id);
  };
  const joinCouple = () => setCoupleId(inputCoupleId);

  const baseDate = new Date();
  baseDate.setMonth(baseDate.getMonth() + monthOffset);
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dday = weddingDate ? Math.ceil((new Date(weddingDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const totalBudget = budgetItems.reduce((a, b) => a + b.cost, 0);

  if (!user) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "linear-gradient(135deg,#fce3ec,#ffe8d6)" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "40px" }}>💍 Wedding</h1>
          <button onClick={login} style={{ padding: "15px 30px", fontSize: "18px", borderRadius: "12px", border: "none", background: "#ff8fa3", color: "white", cursor: "pointer" }}>
            Google로 로그인
          </button>
        </div>
      </div>
    );
  }

  if (!coupleId) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <button onClick={createCouple}>커플 생성</button>
          <input onChange={(e) => setInputCoupleId(e.target.value)} placeholder="초대 코드 입력" />
          <button onClick={joinCouple}>입장</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#fff5f7", padding: "20px", fontFamily: "'Arial', sans-serif" }}>

      {/* 탭 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        {["home", "tasks", "guests", "budget"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: "12px", borderRadius: "20px", border: "none", background: tab === t ? "#ff8fa3" : "white", color: tab === t ? "white" : "black", fontWeight: "bold"
          }}>
            {t === "home" ? "홈" : t === "tasks" ? "할일" : t === "guests" ? "하객" : "예산"}
          </button>
        ))}
        <button onClick={logout} style={{ marginLeft: "10px", padding: "8px 12px", borderRadius: "12px", background: "#ffb3c1", border: "none" }}>로그아웃</button>
      </div>

      {/* 홈 탭 */}
      {tab === "home" && (
        <div>
          {/* 사진 슬라이드 */}
          <div style={{ position: "relative", borderRadius: "20px", overflow: "hidden", marginBottom: "20px" }}>
            {images.length > 0 && <img src={images[currentImage]} style={{ width: "100%", maxHeight: "300px", objectFit: "cover" }} />}
            <div style={{ display: "flex", justifyContent: "center", gap: "5px", position: "absolute", bottom: "10px", width: "100%" }}>
              {images.map((img, idx) => (
                <img key={idx} src={img} onClick={() => setCurrentImage(idx)} style={{
                  width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px", border: idx === currentImage ? "2px solid #ff8fa3" : "1px solid #ccc", cursor: "pointer"
                }} />
              ))}
            </div>
            <label style={{ position: "absolute", top: "10px", right: "10px", background: "#fff", padding: "5px 10px", borderRadius: "10px", cursor: "pointer" }}>
              사진 추가
              <input type="file" style={{ display: "none" }} onChange={(e) => {
                const file = e.target.files[0];
                const reader = new FileReader();
                reader.onload = () => setImages([...images, reader.result]);
                reader.readAsDataURL(file);
              }} />
            </label>
          </div>

          {/* D-day */}
          <div style={{ background: "white", padding: "20px", borderRadius: "20px", textAlign: "center", marginBottom: "20px" }}>
            <h2>D-{dday ?? "?"}</h2>
            <input type="date" value={weddingDate} onChange={(e) => setWeddingDate(e.target.value)} style={{ padding: "10px", borderRadius: "12px", border: "1px solid #ddd", marginTop: "10px" }} />
          </div>

          {/* 달력 */}
          <div style={{ background: "white", padding: "20px", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <button onClick={() => setMonthOffset(monthOffset - 1)}>◀ 이전달</button>
              <h3>{year}년 {month + 1}월</h3>
              <button onClick={() => setMonthOffset(monthOffset + 1)}>다음달 ▶</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px" }}>
              {[...Array(daysInMonth)].map((_, i) => {
                const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                const hasEvent = events.find(e => e.date === date);
                return (
                  <div key={i} onClick={() => setSelectedDate(date)} style={{
                    padding: "12px", borderRadius: "10px", background: hasEvent ? "#ffccd5" : "#f9f9f9", textAlign: "center", cursor: "pointer"
                  }}>
                    {i + 1}
                  </div>
                );
              })}
            </div>

            {selectedDate && (
              <div style={{ marginTop: "10px" }}>
                <h4>{selectedDate}</h4>
                {events.filter(e => e.date === selectedDate).map((e, i) => (<div key={i}>{e.text}</div>))}
                <input placeholder="일정" value={eventText} onChange={(e) => setEventText(e.target.value)} style={{ padding: "5px", borderRadius: "10px", border: "1px solid #ddd", marginRight: "5px" }} />
                <button onClick={() => {
                  setEvents([...events, { text: eventText, date: selectedDate }]);
                  setEventText("");
                }}>추가</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 할일 탭 */}
      {tab === "tasks" && (
        <div>
          <div style={{ background: "white", padding: "15px", borderRadius: "20px", marginBottom: "20px" }}>
            <select onChange={(e) => setCategory(e.target.value)} value={category} style={{ padding: "8px", borderRadius: "10px", marginRight: "5px" }}>
              <option>스드메</option>
              <option>웨딩홀</option>
              <option>신혼여행</option>
              <option>예물</option>
              <option>혼수</option>
            </select>
            <input value={taskText} onChange={(e) => setTaskText(e.target.value)} placeholder="할 일 입력" style={{ padding: "8px", borderRadius: "10px", border: "1px solid #ddd", width: "60%", marginRight: "5px" }} />
            <button onClick={() => {
              setTasks([...tasks, { text: taskText, category, done: false }]);
              setTaskText("");
            }}>추가</button>

            <div style={{ marginTop: "10px" }}>
              {Object.entries(tasks.reduce((acc, t) => {
                acc[t.category] = acc[t.category] || [];
                acc[t.category].push(t);
                return acc;
              }, {})).map(([cat, list]) => (
                <div key={cat} style={{ marginBottom: "10px" }}>
                  <b>{cat}</b>
                  {list.map((t, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                      <span style={{ textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
                      <div>
                        <button onClick={() => {
                          let x = [...tasks]; x[i].done = !x[i].done; setTasks(x);
                        }}>{t.done ? "완료" : "미완료"}</button>
                        <button onClick={() => setTasks(tasks.filter((_, idx) => idx !== i))}>삭제</button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 하객 탭 */}
      {tab === "guests" && (
        <div>
          {/* 상위 탭 */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
            {["신랑", "신부"].map(p => (
              <button key={p} onClick={() => setGuestParent(p)} style={{ flex: 1, padding: "8px", borderRadius: "12px", border: "none", background: guestParent === p ? "#ff8fa3" : "#eee", color: guestParent === p ? "white" : "black" }}>
                {p}
              </button>
            ))}
          </div>

          <input placeholder="카테고리" value={guestCategory} onChange={(e) => setGuestCategory(e.target.value)} style={{ padding: "5px", borderRadius: "8px", marginRight: "5px" }} />
          <input placeholder="이름" value={guestName} onChange={(e) => setGuestName(e.target.value)} style={{ padding: "5px", borderRadius: "8px", marginRight: "5px" }} />
          <button onClick={() => {
            setGuests([...guests, { parent: guestParent, category: guestCategory, name: guestName }]);
            setGuestName(""); setGuestCategory("");
          }}>추가</button>

          <input placeholder="검색" value={guestSearch} onChange={(e) => setGuestSearch(e.target.value)} style={{ marginTop: "10px", padding: "5px", borderRadius: "8px", width: "100%" }} />

          <div style={{ marginTop: "10px", maxHeight: "250px", overflowY: "auto", background: "white", borderRadius: "15px", padding: "10px" }}>
            {guests.filter(g => g.name.includes(guestSearch) || g.category.includes(guestSearch)).map((g, i) => (
              <div key={i} style={{ padding: "5px", borderBottom: "1px solid #eee" }}>
                <b>{g.parent} > {g.category}</b> : {g.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 예산 탭 */}
      {tab === "budget" && (
        <div style={{ background: "white", padding: "15px", borderRadius: "20px" }}>
          <h3>💰 예산: {totalBudget}원</h3>
          <input placeholder="항목" value={budgetName} onChange={(e) => setBudgetName(e.target.value)} style={{ padding: "8px", borderRadius: "10px", border: "1px solid #ddd", marginRight: "5px" }} />
          <input placeholder="금액" type="number" value={budgetCost} onChange={(e) => setBudgetCost(e.target.value)} style={{ padding: "8px", borderRadius: "10px", border: "1px solid #ddd", marginRight: "5px" }} />
          <button onClick={() => {
            setBudgetItems([...budgetItems, { name: budgetName, cost: +budgetCost }]);
            setBudgetName(""); setBudgetCost("");
          }}>추가</button>

          <div style={{ marginTop: "10px" }}>
            {budgetItems.map((b, i) => (<div key={i}>{b.name} - {b.cost}원</div>))}
          </div>
        </div>
      )}

    </div>
  );
}