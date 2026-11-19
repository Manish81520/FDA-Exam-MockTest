import { K } from "../i18n";
import Icon from "./Icon";

type Active = "home" | "exam" | "past";
interface Props { active: Active; onHome: () => void; onPast: () => void; onLogout: () => void }

export default function NavBar({ active, onHome, onPast, onLogout }: Props) {
  const link = (key: Active, label: string, onClick: () => void) => (
    <button type="button" className={`nav-link${active === key ? " on" : ""}`}
      aria-current={active === key ? "page" : undefined} onClick={onClick}>{label}</button>
  );
  return (
    <header className="nav">
      <div className="nav-in">
        <div className="brand"><b>FDA Mock Exam</b><span>{K.brandSub}</span></div>
        <nav>{link("home", K.navHome, onHome)}{link("exam", K.navExams, onHome)}{link("past", K.navPast, onPast)}</nav>
        <div className="who">
          <div><small>{K.candidate}</small><span>{K.active}</span></div>
          <i className="avatar"><Icon n="user" /></i>
        </div>
        <button type="button" className="icon-btn" aria-label="Logout" onClick={onLogout}><Icon n="logout" /></button>
      </div>
    </header>
  );
}
