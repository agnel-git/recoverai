import { useState } from "react";
import Dashboard from "./components/Dashboard.jsx";
import Queue from "./components/Queue.jsx";
import Simulator from "./components/Simulator.jsx";
import TransactionDetail from "./components/TransactionDetail.jsx";

const TABS = ["Dashboard", "Priority Queue", "Simulator"];

export default function App() {
  const [tab, setTab] = useState("Dashboard");
  const [selected, setSelected] = useState(null);
  const [version, setVersion] = useState(0); // bump to refetch after approve/analyze

  return (
    <div className="min-h-screen">
      <header className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recover<span className="text-emerald-400">AI</span></h1>
        <nav className="flex gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-sm ${tab === t ? "bg-emerald-500 text-slate-900" : "hover:bg-slate-700"}`}>
              {t}
            </button>
          ))}
        </nav>
      </header>
      <main className="max-w-6xl mx-auto p-6">
        {tab === "Dashboard" && <Dashboard version={version} />}
        {tab === "Priority Queue" && <Queue version={version} onSelect={setSelected} onChanged={() => setVersion((v) => v + 1)} />}
        {tab === "Simulator" && <Simulator />}
      </main>
      {selected && (
        <TransactionDetail id={selected} onClose={() => setSelected(null)} onChanged={() => setVersion((v) => v + 1)} />
      )}
    </div>
  );
}
