import React, { useState, useEffect } from "react";
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

  const [tab, setTab] = useState("home");

  // 사진
  const [images, setImages] = useState([]);
  const [currentImage, setCurrentImage] = useState(0);

  // 할일
  const [tasks, setTasks] = useState([]);
  const [taskCategory, setTaskCategory] = useState("");
  const [taskText, setTaskText] = useState("");

  // 달력/이벤트
  const [events, setEvents] = useState([]);
  const [eventText, setEventText] = useState("");
  const [eventDate, setEventDate] = useState("");

  useEffect(() => onAuthStateChanged(auth, (u) => u && setUser(u)), []);

  useEffect(() => {
    if (!coupleId) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "couples", coupleId));
      if (snap.exists()) {
        const d = snap.data();
        setTasks(d.tasks || []);
        setEvents(d.events || []);
        setImages(d.images || []);
      }
    };
    load();
  }, [coupleId]);

  useEffect(() => {
    if (!coupleId) return;
    setDoc(doc(db, "couples", coupleId), { tasks, events, images });
  }, [tasks, events, images, coupleId]);

  const login = () => signInWithPopup(auth, provider);

  const createCouple = () => {
    const id = Math.random().toString(36).slice(2, 8);
    setCoupleId(id);
    navigator.clipboard.writeText(id);
    alert("코드 복사됨: " + id);
  };

  const joinCouple = () => setCoupleId(inputCoupleId);

  if (!user)
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", background: "#f8f5f2" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "20px", textAlign: "center" }}>
          <h1>Wedding</h1>
          <button onClick={login}>Google 로그인</button>
        </div>
      </div>
    );

  if (!coupleId)
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <div>
          <button onClick={createCouple}>커플 생성</button>
          <input onChange={(e) => setInputCoupleId(e.target.value)} placeholder="초대 코드 입력" />
          <button onClick={joinCouple}>입장</button>
        </div>
      </div>
    );

  return (
    <div style={{ padding: "20px", background: "#f8f5f2", minHeight: "100vh", fontFamily: "'Arial', sans-serif" }}>
      {/* 대표 사진 업로드 */}
      <div style={{ marginBottom: "20px", maxHeight: "50vh", position: "relative" }}>
        {images.length > 0 && (
          <img
            src={images[currentImage]}
            style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "20px" }}
          />
        )}
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => setImages([...images, reader.result]);
            reader.readAsDataURL(file);
          }}
        />
        {images.length > 0 && (
          <button
            onClick={() => {
              const imgs = [...images];
              imgs.splice(currentImage, 1);
              setImages(imgs);
              setCurrentImage(0);
            }}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
              background: "rgba(255,0,0,0.7)",
              color: "white",
              border: "none",
              padding: "5px 10px",
              borderRadius: "10px",
              cursor: "pointer",
            }}
          >
            삭제
          </button>
        )}
      </div>

      {/* 탭 */}
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "20px" }}>
        <button onClick={() => setTab("home")}>홈</button>
        <button onClick={() => setTab("tasks")}>할일</button>
        <button onClick={() => setTab("calendar")}>달력</button>
      </div>

      {/* 홈 */}
      {tab === "home" && (
        <div>
          <h2>우리의 웨딩</h2>
          <p>커플코드: {coupleId}</p>
        </div>
      )}

      {/* 할일 */}
      {tab === "tasks" && (
        <div>
          <div style={{ display: "flex", gap: "5px", marginBottom: "10px" }}>
            <input
              placeholder="카테고리"
              value={taskCategory}
              onChange={(e) => setTaskCategory(e.target.value)}
              style={{ padding: "5px", borderRadius: "8px", flex: 1 }}
            />
            <input
              placeholder="내용"
              value={taskText}
              onChange={(e) => setTaskText(e.target.value)}
              style={{ padding: "5px", borderRadius: "8px", flex: 2 }}
            />
            <button
              onClick={() => {
                if (!taskCategory || !taskText) return;
                setTasks([...tasks, { category: taskCategory, text: taskText, done: false }]);
                setTaskCategory("");
                setTaskText("");
              }}
            >
              추가
            </button>
          </div>
          {/* 카테고리별 묶기 */}
          {Object.entries(
            tasks.reduce((acc, t) => {
              acc[t.category] = acc[t.category] || [];
              acc[t.category].push(t);
              return acc;
            }, {})
          ).map(([cat, list]) => (
            <div key={cat} style={{ marginBottom: "10px" }}>
              <b>{cat}</b>
              {list.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                  <span
                    style={{ cursor: "pointer", textDecoration: t.done ? "line-through" : "none" }}
                    onClick={() => {
                      const x = [...tasks];
                      const idx = tasks.indexOf(t);
                      x[idx].done = !x[idx].done;
                      setTasks(x);
                    }}
                  >
                    {t.done ? "✅" : "⬜"} {t.text}
                  </span>
                  <button
                    onClick={() => setTasks(tasks.filter((task) => task !== t))}
                    style={{ marginLeft: "5px", background: "#ff8fa3", color: "white", border: "none", borderRadius: "5px" }}
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 달력 */}
      {tab === "calendar" && (
        <div>
          <input
            placeholder="일정"
            value={eventText}
            onChange={(e) => setEventText(e.target.value)}
          />
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
          <button
            onClick={() => {
              if (!eventText || !eventDate) return;
              setEvents([...events, { text: eventText, date: eventDate }]);
              setEventText("");
              setEventDate("");
            }}
          >
            추가
          </button>

          {events.map((e, i) => (
            <div key={i}>
              {e.date} - {e.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}