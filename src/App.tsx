import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck, Bell, CalendarDays, FolderOpen, GraduationCap, Home, LogOut, UserRound, WifiOff,
} from "lucide-react";
import { api, ApiError } from "./lib/api";
import type {
  Application, DeanData, Payload, Profile, PublicInfo, Role, StaffAccount, TeacherData,
} from "./lib/types";
import { I18nProvider, useI18n } from "./lib/i18n";
import { ThemeProvider } from "./lib/theme";
import { Avatar, ToastProvider, useToast } from "./components/ui";
import { Brand, LogoMark } from "./components/Logo";
import { LangToggle, LoginScreen, ThemeToggle } from "./components/LoginScreen";
import { NewRequestSheet } from "./components/NewRequestSheet";
import { ApplicationSheet } from "./components/ApplicationSheet";
import { HomeView } from "./views/HomeView";
import { ScheduleView } from "./views/ScheduleView";
import { GradesView } from "./views/GradesView";
import { DocumentsView } from "./views/DocumentsView";
import { NotificationsView } from "./views/NotificationsView";
import { ProfileView } from "./views/ProfileView";
import { TeacherView } from "./views/TeacherView";
import { DeanView } from "./views/DeanView";

type Route = "home" | "schedule" | "grades" | "documents" | "notifications" | "profile";

type Session = { role: Role; account: Profile | StaffAccount };

const navItems: { route: Route; key: string; icon: typeof Home }[] = [
  { route: "home", key: "nav.home", icon: Home },
  { route: "schedule", key: "nav.schedule", icon: CalendarDays },
  { route: "grades", key: "nav.grades", icon: GraduationCap },
  { route: "documents", key: "nav.documents", icon: FolderOpen },
  { route: "notifications", key: "nav.notifications", icon: Bell },
  { route: "profile", key: "nav.profile", icon: UserRound },
];

function Boot({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  const { t } = useI18n();
  return (
    <div className="boot">
      <span className="boot-mark"><LogoMark size={30} /></span>
      <p className="small">{error ? t("common.error") : t("common.loading")}</p>
      {error && onRetry ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          <WifiOff size={15} /> {t("common.retry")}
        </button>
      ) : null}
    </div>
  );
}

function StaffShell({
  role, account, onLogout, children,
}: {
  role: "teacher" | "dean";
  account: StaffAccount;
  onLogout: () => void;
  children: React.ReactNode;
}) {
  const { t, pick } = useI18n();
  return (
    <div className="staff-shell">
      <header className="staff-top">
        <Brand />
        <span className="role-pill">
          <BadgeCheck size={13} />
          {role === "teacher" ? t("teacher.role") : t("dean.role")}
        </span>
        <span className="grow" />
        <LangToggle compact />
        <ThemeToggle compact />
        <button type="button" className="icon-btn" onClick={onLogout} aria-label={t("profile.logout")} title={t("profile.logout")}>
          <LogOut size={18} />
        </button>
        <Avatar name={pick(account.fullName)} hue={account.hue} />
      </header>
      <main className="staff-main">{children}</main>
      <footer className="staff-foot">
        {pick(account.fullName)} · {pick(account.title)} · {t("common.demo")}
      </footer>
    </div>
  );
}

function Root() {
  const { t, pick } = useI18n();
  const { notify } = useToast();
  const [boot, setBoot] = useState<"checking" | "anon" | "ready" | "error">("checking");
  const [info, setInfo] = useState<PublicInfo | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [data, setData] = useState<Payload | null>(null);
  const [staff, setStaff] = useState<TeacherData | DeanData | null>(null);
  const [route, setRoute] = useState<Route>("home");
  const [now, setNow] = useState(() => new Date());
  const [openAppId, setOpenAppId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const fetchFor = useCallback(async (role: Role) => {
    if (role === "student") return api.data();
    if (role === "teacher") return api.teacher();
    return api.dean();
  }, []);

  const applyFor = (role: Role, value: Payload | TeacherData | DeanData) => {
    if (role === "student") setData(value as Payload);
    else setStaff(value as TeacherData | DeanData);
  };

  const clearAccount = () => {
    setSession(null);
    setData(null);
    setStaff(null);
    setOpenAppId(null);
    setNewOpen(false);
  };

  const load = useCallback(async (silent = false) => {
    if (!session) return;
    try {
      const value = await fetchFor(session.role);
      applyFor(session.role, value);
      setBoot("ready");
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearAccount();
        setBoot("anon");
      } else if (!silent) {
        setBoot("error");
      }
    }
  }, [session, fetchFor]);

  useEffect(() => {
    let cancelled = false;
    api.publicInfo().then((value) => { if (!cancelled) setInfo(value); }).catch(() => undefined);
    api.session()
      .then(async (result) => {
        const value = await fetchFor(result.role);
        if (cancelled) return;
        setSession({ role: result.role, account: result.account });
        applyFor(result.role, value);
        setBoot("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 401) setBoot("anon");
        else setBoot("error");
      });
    return () => { cancelled = true; };
  }, [fetchFor]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (boot !== "ready") return;
    const timer = window.setInterval(() => { void load(true); }, 45_000);
    const onVisible = () => { if (document.visibilityState === "visible") void load(true); };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [boot, load]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  const go = useCallback((next: Route) => setRoute(next), []);

  const login = async (loginName: string, password: string) => {
    const result = await api.login(loginName, password);
    const value = await fetchFor(result.role);
    setSession({ role: result.role, account: result.account });
    applyFor(result.role, value);
    if (result.role === "student") setRoute("home");
    setBoot("ready");
    setNow(new Date());
  };

  const logout = useCallback(() => {
    void api.logout().catch(() => undefined);
    clearAccount();
    setBoot("anon");
  }, []);

  const openNew = useCallback((code?: string) => {
    setNewCode(code ?? null);
    setNewOpen(true);
  }, []);

  const submitApplication = async (body: { typeCode: string; copies: number; delivery: string; urgency: string; comment: string }) => {
    const result = await api.createApplication(body);
    setData((current) => current ? { ...current, applications: [result.application, ...current.applications] } : current);
    return result.application;
  };

  const openCreated = (app: Application) => {
    setNewOpen(false);
    setNewCode(null);
    setOpenAppId(app.id);
    notify(t("toast.requestCreated"));
  };

  const cancelApplication = async (app: Application) => {
    setActionBusy(true);
    try {
      const result = await api.cancelApplication(app.id);
      setData((current) => current ? {
        ...current,
        applications: current.applications.map((item) => item.id === app.id ? result.application : item),
      } : current);
      setOpenAppId(null);
      notify(t("detail.cancelledToast"));
    } catch {
      notify(t("common.error"));
    } finally {
      setActionBusy(false);
    }
  };

  const collectApplication = async (app: Application) => {
    setActionBusy(true);
    try {
      const result = await api.collectApplication(app.id);
      setData((current) => current ? {
        ...current,
        applications: current.applications.map((item) => item.id === app.id ? result.application : item),
      } : current);
      notify(t("detail.collectedToast"));
    } catch {
      notify(t("common.error"));
    } finally {
      setActionBusy(false);
    }
  };

  const markRead = (id: string) => {
    setData((current) => current ? {
      ...current,
      notifications: current.notifications.map((item) => item.id === id ? { ...item, read: true } : item),
    } : current);
    void api.markRead([id]).catch(() => undefined);
  };

  const markAll = () => {
    setData((current) => current ? {
      ...current,
      notifications: current.notifications.map((item) => ({ ...item, read: true })),
    } : current);
    void api.markRead("all").catch(() => undefined);
    notify(t("toast.readAll"));
  };

  const revokeAll = async () => {
    try {
      await api.revokeAll();
    } finally {
      clearAccount();
      setBoot("anon");
      notify(t("toast.revoked"));
    }
  };

  const openApp = useMemo(
    () => data?.applications.find((app) => app.id === openAppId) ?? null,
    [data, openAppId],
  );
  const unread = data?.notifications.filter((item) => !item.read).length ?? 0;

  if (boot === "checking") return <Boot />;
  if (boot === "error") return <Boot error onRetry={() => { setBoot("checking"); void load(); }} />;
  if (boot === "anon" || !session) {
    return <LoginScreen info={info} onLogin={login} />;
  }

  if (session.role !== "student") {
    if (!staff) return <Boot />;
    const account = session.account as StaffAccount;
    return (
      <StaffShell role={session.role} account={account} onLogout={logout}>
        {session.role === "teacher"
          ? <TeacherView data={staff as TeacherData} onRefresh={() => load(true)} />
          : <DeanView data={staff as DeanData} onRefresh={() => load(true)} />}
      </StaffShell>
    );
  }

  if (!data) return <Boot />;
  const name = pick(data.profile.shortName);

  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand sub={pick(data.university.short)} onClick={() => go("home")} />
        <nav className="side-nav" aria-label="Main">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.route} type="button" className={`nav-item ${route === item.route ? "active" : ""}`} onClick={() => go(item.route)}>
                <Icon size={18} strokeWidth={1.9} />
                <span className="grow" style={{ textAlign: "left" }}>{t(item.key)}</span>
                {item.route === "notifications" && unread ? <span className="nav-badge">{unread}</span> : null}
              </button>
            );
          })}
        </nav>
        <div className="side-foot">
          <div className="row" style={{ gap: 8 }}>
            <LangToggle />
            <span className="tiny muted grow" style={{ textAlign: "right" }}>{pick(data.profile.group)}</span>
          </div>
          <button type="button" className="user-chip" onClick={() => go("profile")}>
            <Avatar name={pick(data.profile.fullName)} hue={data.profile.hue} />
            <span className="grow" style={{ minWidth: 0 }}>
              <span className="small" style={{ display: "block", fontWeight: 650, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
              <span className="tiny muted">{pick(data.profile.program)}</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <Brand onClick={() => go("home")} />
          <span className="grow" />
          <LangToggle compact />
          <span className="bell-wrap">
            <button type="button" className="icon-btn" onClick={() => go("notifications")} aria-label={t("nav.notifications")}>
              <Bell size={19} />
            </button>
            {unread ? <span className="bell-badge">{unread > 9 ? "9+" : unread}</span> : null}
          </span>
          <button type="button" className="icon-btn" style={{ padding: 3 }} onClick={() => go("profile")} aria-label={t("nav.profile")}>
            <Avatar name={pick(data.profile.fullName)} hue={data.profile.hue} />
          </button>
        </header>

        <main className="content">
          {route === "home" ? (
            <HomeView data={data} now={now} onNavigate={(next) => go(next)} onNewRequest={() => openNew()} />
          ) : null}
          {route === "schedule" ? <ScheduleView data={data} now={now} /> : null}
          {route === "grades" ? <GradesView data={data} /> : null}
          {route === "documents" ? (
            <DocumentsView data={data} onNewRequest={openNew} onOpenApp={(app) => setOpenAppId(app.id)} />
          ) : null}
          {route === "notifications" ? (
            <NotificationsView data={data} onRead={markRead} onNavigate={(next) => go(next)} onMarkAll={markAll} />
          ) : null}
          {route === "profile" ? <ProfileView data={data} onLogout={logout} onRevokeAll={revokeAll} /> : null}
        </main>

        <nav className="tabbar" aria-label="Main">
          {navItems.filter((item) => item.route !== "notifications").map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.route} type="button" className={`tab ${route === item.route ? "active" : ""}`} onClick={() => go(item.route)}>
                <Icon size={20} strokeWidth={route === item.route ? 2.2 : 1.8} />
                <span>{t(item.key)}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <NewRequestSheet
        open={newOpen}
        catalog={data.catalog}
        initialCode={newCode}
        onClose={() => { setNewOpen(false); setNewCode(null); }}
        onSubmit={submitApplication}
        onOpenCreated={openCreated}
      />
      <ApplicationSheet
        app={openApp}
        profile={data.profile}
        university={data.university.name}
        open={openAppId !== null}
        onClose={() => setOpenAppId(null)}
        onCancel={cancelApplication}
        onCollect={collectApplication}
        busy={actionBusy}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <ToastProvider>
          <Root />
        </ToastProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
