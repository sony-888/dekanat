import { useState } from "react";
import { AlertCircle, CalendarDays, Eye, EyeOff, FileCheck2, Loader2, Lock, Moon, ShieldCheck, Sun } from "lucide-react";
import { useI18n } from "../lib/i18n";
import { useTheme } from "../lib/theme";
import { ApiError } from "../lib/api";
import type { Lang, PublicInfo } from "../lib/types";
import { Brand } from "./Logo";

export function LangToggle({ compact }: { compact?: boolean }) {
  const { lang, setLang } = useI18n();
  const next: Lang = lang === "ru" ? "en" : "ru";
  return (
    <button
      type="button"
      className={compact ? "icon-btn" : "btn btn-ghost btn-sm"}
      onClick={() => setLang(next)}
      aria-label={lang === "ru" ? "Switch to English" : "Переключить на русский"}
      title={lang === "ru" ? "English" : "Русский"}
    >
      {compact ? null : <span className="tiny" style={{ fontWeight: 700, letterSpacing: "0.04em" }}>{lang === "ru" ? "RU" : "EN"}</span>}
      {compact ? <span style={{ fontSize: 12, fontWeight: 700 }}>{lang === "ru" ? "RU" : "EN"}</span> : null}
    </button>
  );
}

export function ThemeToggle({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className={compact ? "icon-btn" : "btn btn-ghost btn-sm"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Light theme" : "Dark theme"}
    >
      {dark ? <Sun size={16} /> : <Moon size={16} />}
      {compact ? null : <span style={{ fontSize: 12.5 }}>{dark ? "Light" : "Dark"}</span>}
    </button>
  );
}

export function LoginScreen({
  info, onLogin,
}: {
  info: PublicInfo | null;
  onLogin: (login: string, password: string) => Promise<void>;
}) {
  const { t, pick, lang } = useI18n();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await onLogin(login.trim(), password);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "invalid_credentials") setError(t("login.errorCredentials"));
        else if (err.code === "rate_limited") setError(t("login.errorRate"));
        else if (err.code === "invalid_input") setError(t("login.errorCredentials"));
        else setError(t("login.errorGeneric"));
      } else {
        setError(t("login.errorGeneric"));
      }
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <section className="login-visual">
        <div className="login-brand">
          <Brand sub={pick(info?.university.short)} />
        </div>
        <div>
          <p className="eyebrow" style={{ color: "rgba(247,243,232,0.6)" }}>{t("login.eyebrow")}</p>
          <h1 className="login-quote" style={{ marginTop: 12 }}>
            {t("login.quote")}
          </h1>
          <p style={{ color: "rgba(247,243,232,0.72)", fontSize: 14, lineHeight: 1.55, maxWidth: 420, marginTop: 16 }}>
            {t("login.tagline")}
          </p>
        </div>
        <div className="login-visual-foot">
          <div className="login-feats">
            <span><CalendarDays size={14} /> {lang === "ru" ? "Расписание и изменения" : "Schedule & changes"}</span>
            <span><FileCheck2 size={14} /> {lang === "ru" ? "Справки за пару минут" : "Documents in minutes"}</span>
            <span><ShieldCheck size={14} /> {lang === "ru" ? "Только ваши данные" : "Your data only"}</span>
          </div>
          <p className="login-visual-credits">{t("login.footer")}</p>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-top-actions">
          <LangToggle compact />
          <ThemeToggle compact />
        </div>
        <form className="login-form" onSubmit={submit}>
          <div>
            <p className="eyebrow">{t("login.eyebrow")}</p>
            <h2 className="h1" style={{ fontSize: 32, marginTop: 8 }}>
              {t("login.title")}
            </h2>
            <p className="muted small" style={{ marginTop: 8 }}>
              {t("login.subtitle")}
            </p>
          </div>

          <div className="field">
            <label htmlFor="login">{t("login.login")}</label>
            <input
              id="login"
              className="input"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="a.sokolova"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">{t("login.password")}</label>
            <div className="input-wrap">
              <input
                id="password"
                className="input"
                type={reveal ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••"
                required
              />
              <button
                type="button"
                className="reveal"
                onClick={() => setReveal((value) => !value)}
                aria-label={reveal ? t("login.hide") : t("login.show")}
              >
                {reveal ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {error ? (
            <div className="form-error" role="alert">
              <AlertCircle size={16} style={{ flex: "none", marginTop: 1 }} />
              <span>{error}</span>
            </div>
          ) : null}

          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? <Loader2 size={16} className="spin" /> : <Lock size={16} />}
            {busy ? t("login.submitting") : t("login.submit")}
          </button>

          <p className="login-foot">{t("login.footer")}</p>
        </form>
      </section>
    </main>
  );
}
