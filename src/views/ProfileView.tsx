import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { IdCard, KeyRound, LogOut, RefreshCcw, ShieldCheck, Sparkles } from "lucide-react";
import type { Payload } from "../lib/types";
import { useI18n } from "../lib/i18n";
import { useTheme, type ThemeMode } from "../lib/theme";
import { Avatar, Seg } from "../components/ui";
import { LogoMark } from "../components/Logo";

export function ProfileView({
  data, onLogout, onRevokeAll,
}: {
  data: Payload;
  onLogout: () => void;
  onRevokeAll: () => Promise<void>;
}) {
  const { t, pick, lang, setLang } = useI18n();
  const { theme, setTheme } = useTheme();
  const [flipped, setFlipped] = useState(false);
  const [qr, setQr] = useState<string>("");
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const profile = data.profile;

  useEffect(() => {
    QRCode.toDataURL(`ATLAS:STUDENT:${profile.studentCard}`, {
      width: 320, margin: 1, color: { dark: "#0a3327", light: "#ffffff" },
    }).then(setQr).catch(() => undefined);
  }, [profile.studentCard]);

  const revoke = async () => {
    setRevoking(true);
    try {
      await onRevokeAll();
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="page-enter stack">
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <p className="eyebrow">{t("nav.profile")}</p>
          <h1 className="h1" style={{ marginTop: 6 }}>{t("profile.title")}</h1>
          <p className="page-sub">{t("profile.subtitle")}</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-ghost" onClick={onLogout}>
            <LogOut size={15} />
            <span className="long">{t("profile.logout")}</span>
          </button>
        </div>
      </div>

      <div className="home-grid">
        <div className="home-col">
          <section className="card card-pad">
            <div className="section-head" style={{ marginBottom: 10 }}>
              <h2 className="h2">{t("profile.idCard")}</h2>
              <span className="tiny muted" style={{ display: "inline-flex", gap: 5, alignItems: "center" }}><IdCard size={13} /> {profile.studentCard}</span>
            </div>
            <div className="id-card-wrap">
              <div
                className={`id-card-flip ${flipped ? "flipped" : ""}`}
                onClick={() => setFlipped((value) => !value)}
                role="button"
                tabIndex={0}
                aria-label={t("profile.flip")}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setFlipped((value) => !value); } }}
              >
                <div className="id-face">
                  <div className="id-head">
                    <LogoMark size={34} />
                    <span className="id-uni">{pick(data.university.short)} · student id</span>
                  </div>
                  <div style={{ marginTop: "auto" }}>
                    <div className="id-name">{pick(profile.fullName)}</div>
                    <div className="id-meta">
                      <div><span>{t("profile.group")}</span><b>{profile.group}</b></div>
                      <div><span>{t("profile.year")}</span><b>{t("profile.yearValue", { n: profile.year })}</b></div>
                      <div><span>{t("profile.program")}</span><b>{pick(profile.program)}</b></div>
                    </div>
                  </div>
                  <div className="id-foot">
                    <div>
                      <div className="id-num">{profile.studentCard}</div>
                      <div className="id-hint">{t("profile.flip")}</div>
                    </div>
                    {qr ? <span className="id-qr"><img src={qr} alt="QR" /></span> : null}
                  </div>
                </div>
                <div className="id-face id-back">
                  {qr ? <span className="id-back-qr"><img src={qr} alt="QR" /></span> : null}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--site-font-display)", fontSize: 18 }}>{pick(profile.shortName)}</div>
                    <div className="id-hint">{t("profile.valid")}</div>
                  </div>
                  <div className="id-num">{pick(data.university.name)}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-head" style={{ marginBottom: 4 }}>
              <h2 className="h2">{t("profile.personal")}</h2>
              <Avatar name={pick(profile.fullName)} hue={profile.hue} />
            </div>
            <div className="info-list">
              <div className="info-row"><span>{t("profile.fullName")}</span><b>{pick(profile.fullName)}</b></div>
              <div className="info-row"><span>{t("profile.email")}</span><b>{profile.email}</b></div>
              <div className="info-row"><span>{t("profile.phone")}</span><b>{profile.phone}</b></div>
              <div className="info-row"><span>{t("profile.curator")}</span><b>{pick(profile.curator)}</b></div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-head" style={{ marginBottom: 4 }}>
              <h2 className="h2">{t("login.eyebrow")}</h2>
              <span className="pill pill-accent">{pick(profile.degree)}</span>
            </div>
            <div className="info-list">
              <div className="info-row"><span>{t("profile.faculty")}</span><b>{pick(profile.faculty)}</b></div>
              <div className="info-row"><span>{t("profile.program")}</span><b>{pick(profile.program)}</b></div>
              <div className="info-row"><span>{t("profile.studyForm")}</span><b>{pick(profile.studyForm)}</b></div>
              <div className="info-row"><span>{t("profile.year")}</span><b>{t("profile.yearValue", { n: profile.year })}</b></div>
              <div className="info-row"><span>{t("profile.group")}</span><b>{profile.group}</b></div>
              <div className="info-row"><span>{t("profile.admission")}</span><b>{profile.admissionYear}</b></div>
              <div className="info-row"><span>{t("profile.studentCard")}</span><b className="num">{profile.studentCard}</b></div>
            </div>
          </section>
        </div>

        <div className="home-col right">
          <section className="card card-pad">
            <div className="section-head" style={{ marginBottom: 12 }}>
              <h2 className="h2">{t("profile.settings")}</h2>
              <Sparkles size={16} style={{ color: "var(--site-gold)" }} />
            </div>
            <div className="stack">
              <div>
                <div className="small" style={{ fontWeight: 600, marginBottom: 7 }}>{t("profile.language")}</div>
                <Seg
                  label={t("profile.language")}
                  value={lang}
                  options={[{ value: "ru", label: "Русский" }, { value: "en", label: "English" }]}
                  onChange={(value) => setLang(value)}
                />
              </div>
              <div>
                <div className="small" style={{ fontWeight: 600, marginBottom: 7 }}>{t("profile.theme")}</div>
                <Seg<ThemeMode>
                  label={t("profile.theme")}
                  value={theme}
                  options={[
                    { value: "light", label: t("profile.light") },
                    { value: "dark", label: t("profile.dark") },
                    { value: "system", label: t("profile.system") },
                  ]}
                  onChange={setTheme}
                />
              </div>
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-head" style={{ marginBottom: 8 }}>
              <h2 className="h2">{t("profile.security")}</h2>
              <ShieldCheck size={17} style={{ color: "var(--site-accent)" }} />
            </div>
            <p className="muted small" style={{ lineHeight: 1.55 }}>{t("profile.securityBody")}</p>
            <div className="stack-sm" style={{ marginTop: 12 }}>
              <div className="row-between" style={{ fontSize: 12.5 }}>
                <span className="muted">{t("profile.session")}</span>
                <b>{t("profile.sessionValue", { h: 12 })}</b>
              </div>
              {confirmRevoke ? (
                <div className="stack-sm" style={{ border: "1px solid color-mix(in srgb, var(--site-coral) 30%, var(--site-border))", background: "var(--site-coral-soft)", borderRadius: 14, padding: 12 }}>
                  <b style={{ fontSize: 13, color: "var(--site-coral)" }}>{t("profile.revokeTitle")}</b>
                  <p className="tiny" style={{ color: "var(--site-coral)", lineHeight: 1.5 }}>{t("profile.revokeBody")}</p>
                  <div className="row" style={{ gap: 8 }}>
                    <button type="button" className="btn btn-ghost btn-sm grow" onClick={() => setConfirmRevoke(false)}>{t("common.cancel")}</button>
                    <button type="button" className="btn btn-coral btn-sm grow" onClick={revoke} disabled={revoking}>
                      <RefreshCcw size={14} className={revoking ? "spin" : ""} />
                      {t("detail.cancelConfirm")}
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={() => setConfirmRevoke(true)}>
                  <KeyRound size={14} />
                  {t("profile.revokeAll")}
                </button>
              )}
            </div>
          </section>

          <section className="card card-pad">
            <div className="section-head" style={{ marginBottom: 8 }}>
              <h2 className="h2">{t("profile.about")}</h2>
            </div>
            <p className="muted small" style={{ lineHeight: 1.55 }}>{t("profile.aboutBody")}</p>
            <button type="button" className="btn btn-coral btn-block" style={{ marginTop: 14 }} onClick={onLogout}>
              <LogOut size={15} />
              {t("profile.logout")}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
