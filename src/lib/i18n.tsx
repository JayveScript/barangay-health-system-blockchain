"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Lang = "en" | "ceb" | "fil";

export const LANGUAGES: { id: Lang; label: string; short: string }[] = [
  { id: "en", label: "English", short: "EN" },
  { id: "ceb", label: "Bisaya", short: "BIS" },
  { id: "fil", label: "Filipino", short: "FIL" },
];

type Dict = Record<string, string>;

const en: Dict = {
  // Common
  "app.tagline": "Barangay Health Center",
  "common.loading": "Loading...",
  "lang.label": "Language",

  // Login
  "login.welcome": "Welcome back",
  "login.subtitle": "Sign in to your health records",
  "login.username": "Username",
  "login.password": "Password",
  "login.signIn": "Sign In",
  "login.signingIn": "Signing in...",
  "login.noAccount": "Don't have an account?",
  "login.register": "Register here",
  "login.forgot": "Forgot password?",

  // Register
  "register.title": "Create your account",
  "register.subtitle": "Register as a barangay resident",
  "register.next": "Next",
  "register.back": "Back",
  "register.submit": "Create Account",
  "register.submitting": "Submitting...",
  "register.haveAccount": "Already have an account?",
  "register.login": "Sign in",

  // Consent / Data Privacy
  "consent.title": "Data Privacy Consent",
  "consent.heading": "Please read before you continue",
  "consent.body":
    "This Barangay Health Center system collects and keeps your personal and health information — your name, birth date, contact details, and medical records — in order to provide and improve your health care. Your records are kept confidential and are protected with a tamper-proof blockchain seal. We handle your data in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). Your information is used only for your health care and the barangay's official health reports. It is never sold, and it is kept only for as long as needed for these purposes. You may ask to see or correct your records at any time.",
  "consent.rights":
    "Your rights: to be informed, to access, to correct, and to object to the processing of your data.",
  "consent.checkbox":
    "I have read and understood this notice, and I consent to the collection and processing of my personal and health data.",
  "consent.required":
    "Please read and agree to the Data Privacy consent before continuing.",
  "consent.agree": "I Agree & Continue",
  "consent.view": "View Data Privacy Consent",
  "consent.close": "Close",

  // Resident navigation
  "nav.healthPortal": "Health Portal",
  "nav.navigation": "Navigation",
  "nav.announcements": "Announcements",
  "nav.medical": "Medical History",
  "nav.maternal": "Maternal Records",
  "nav.philpen": "PhilPEN",
  "nav.immunization": "Immunization",
  "nav.appointments": "Appointments",
  "nav.notifications": "Notifications",
  "nav.concern": "Health Concern",
  "nav.digitalId": "Digital ID",
  "nav.personal": "Personal Info",
  "nav.changePassword": "Change Password",
  "nav.overview": "Overview",
  "nav.reports": "Reports",
  "nav.residents": "Registered Residents",
  "nav.addResident": "Add Resident",
  "nav.bmi": "BMI Records",
  "nav.diagnose": "Diagnose Patient",
  "nav.referrals": "Referrals",
  "nav.referredResident": "Referred Resident",
  "nav.logbook": "Logbook",
  "nav.scanQr": "Scan QR",
  "nav.manageAnnouncements": "Manage Announcements",
  "nav.archivedResidents": "Archived Residents",
  "nav.createUser": "Create User",
  "nav.staffUsers": "Staff Users",
  "nav.activityLogs": "Activity Logs",
  "nav.residentsShort": "Residents",
  "nav.staff": "Staff",
  "nav.createBarangay": "Create Barangay",
  "nav.barangayAdmins": "Barangay Admins",
  "nav.logout": "Log Out",

  // Duplicate warning
  "dup.title": "Possible duplicate resident",
  "dup.body":
    "A resident with the same name and birth date already exists. Please check before registering again.",
  "dup.proceed": "Register anyway",
  "dup.cancel": "Cancel",
};

const ceb: Dict = {
  "app.tagline": "Barangay Health Center",
  "common.loading": "Nagkarga...",
  "lang.label": "Pinulongan",

  "login.welcome": "Maayong pagbalik",
  "login.subtitle": "Sulod sa imong health records",
  "login.username": "Username",
  "login.password": "Password",
  "login.signIn": "Sulod",
  "login.signingIn": "Nagsulod...",
  "login.noAccount": "Wala kay account?",
  "login.register": "Pagrehistro dinhi",
  "login.forgot": "Nalimtan ang password?",

  "register.title": "Paghimo og account",
  "register.subtitle": "Pagparehistro isip residente sa barangay",
  "register.next": "Sunod",
  "register.back": "Balik",
  "register.submit": "Paghimo og Account",
  "register.submitting": "Gipadala...",
  "register.haveAccount": "Naa na kay account?",
  "register.login": "Sulod",

  "consent.title": "Pagtugot sa Data Privacy",
  "consent.heading": "Palihog basaha una ka mopadayon",
  "consent.body":
    "Kini nga sistema sa Barangay Health Center magkolekta ug magtipig sa imong personal ug panglawas nga impormasyon — imong ngalan, petsa sa pagkatawo, kontak, ug medical records — aron mahatag ug mapauswag ang imong pag-atiman sa panglawas. Ang imong records kompidensyal ug gipanalipdan pinaagi sa dili-mabag-o nga blockchain seal. Among gidumala ang imong datos subay sa Data Privacy Act of 2012 (Republic Act No. 10173). Ang imong impormasyon gamiton lamang alang sa imong pag-atiman sa panglawas ug sa opisyal nga mga report sa barangay. Dili gyud kini ibaligya, ug tipigan lamang samtang gikinahanglan alang niini nga mga katuyoan. Pwede ka mangayo nga makita o matul-id ang imong records bisan kanus-a.",
  "consent.rights":
    "Imong katungod: nga mapahibalo, maka-access, matul-id, ug mosupak sa paggamit sa imong datos.",
  "consent.checkbox":
    "Nabasa ug nasabtan nako kini nga pahibalo, ug mitugot ko sa pagkolekta ug paggamit sa akong personal ug panglawas nga datos.",
  "consent.required":
    "Palihog basaha ug uyoni ang Data Privacy consent una mopadayon.",
  "consent.agree": "Mouyon Ko & Padayon",
  "consent.view": "Tan-awa ang Data Privacy Consent",
  "consent.close": "Sirado",

  "nav.healthPortal": "Health Portal",
  "nav.navigation": "Nabigasyon",
  "nav.announcements": "Mga Pahibalo",
  "nav.medical": "Medical History",
  "nav.maternal": "Maternal Records",
  "nav.philpen": "PhilPEN",
  "nav.immunization": "Bakuna",
  "nav.appointments": "Mga Appointment",
  "nav.notifications": "Mga Pahibalo",
  "nav.concern": "Reklamo sa Panglawas",
  "nav.digitalId": "Digital ID",
  "nav.personal": "Personal nga Impormasyon",
  "nav.changePassword": "Usba ang Password",
  "nav.overview": "Kinatibuk-an",
  "nav.reports": "Mga Report",
  "nav.residents": "Mga Rehistradong Residente",
  "nav.addResident": "Dugang Residente",
  "nav.bmi": "BMI Records",
  "nav.diagnose": "I-diagnose ang Pasyente",
  "nav.referrals": "Mga Referral",
  "nav.referredResident": "Gi-refer nga Residente",
  "nav.logbook": "Logbook",
  "nav.scanQr": "I-scan ang QR",
  "nav.manageAnnouncements": "Dumalaha ang mga Pahibalo",
  "nav.archivedResidents": "Gi-archive nga Residente",
  "nav.createUser": "Paghimo og User",
  "nav.staffUsers": "Mga Staff User",
  "nav.activityLogs": "Activity Logs",
  "nav.residentsShort": "Mga Residente",
  "nav.staff": "Staff",
  "nav.createBarangay": "Paghimo og Barangay",
  "nav.barangayAdmins": "Mga Barangay Admin",
  "nav.logout": "Gawas",

  "dup.title": "Posibleng doble nga residente",
  "dup.body":
    "Naa nay residente nga parehas og ngalan ug petsa sa pagkatawo. Palihog susiha una ka magparehistro pag-usab.",
  "dup.proceed": "Padayon gihapon",
  "dup.cancel": "Kanselar",
};

const fil: Dict = {
  "app.tagline": "Barangay Health Center",
  "common.loading": "Naglo-load...",
  "lang.label": "Wika",

  "login.welcome": "Maligayang pagbabalik",
  "login.subtitle": "Mag-sign in sa iyong health records",
  "login.username": "Username",
  "login.password": "Password",
  "login.signIn": "Mag-sign In",
  "login.signingIn": "Nagsa-sign in...",
  "login.noAccount": "Wala ka pang account?",
  "login.register": "Magrehistro dito",
  "login.forgot": "Nakalimutan ang password?",

  "register.title": "Gumawa ng account",
  "register.subtitle": "Magrehistro bilang residente ng barangay",
  "register.next": "Susunod",
  "register.back": "Bumalik",
  "register.submit": "Gumawa ng Account",
  "register.submitting": "Isinusumite...",
  "register.haveAccount": "May account ka na?",
  "register.login": "Mag-sign in",

  "consent.title": "Pahintulot sa Data Privacy",
  "consent.heading": "Mangyaring basahin bago magpatuloy",
  "consent.body":
    "Ang sistemang ito ng Barangay Health Center ay nangangalap at nag-iimbak ng iyong personal at pangkalusugang impormasyon — pangalan, petsa ng kapanganakan, contact details, at medical records — upang maibigay at mapabuti ang iyong pangangalaga sa kalusugan. Ang iyong mga rekord ay kumpidensyal at protektado ng tamper-proof na blockchain seal. Pinangangasiwaan namin ang iyong datos alinsunod sa Data Privacy Act of 2012 (Republic Act No. 10173). Ang iyong impormasyon ay ginagamit lamang para sa iyong pangangalaga sa kalusugan at sa opisyal na ulat pangkalusugan ng barangay. Hindi ito kailanman ipinagbibili, at itinatago lamang hangga't kinakailangan para sa mga layuning ito. Maaari mong hilingin na makita o itama ang iyong mga rekord anumang oras.",
  "consent.rights":
    "Ang iyong mga karapatan: mabatid, ma-access, maitama, at tumutol sa paggamit ng iyong datos.",
  "consent.checkbox":
    "Nabasa at naunawaan ko ang paunawang ito, at pumapayag ako sa pangangalap at paggamit ng aking personal at pangkalusugang datos.",
  "consent.required":
    "Mangyaring basahin at sumang-ayon sa Data Privacy consent bago magpatuloy.",
  "consent.agree": "Sumasang-ayon Ako & Magpatuloy",
  "consent.view": "Tingnan ang Data Privacy Consent",
  "consent.close": "Isara",

  "nav.healthPortal": "Health Portal",
  "nav.navigation": "Nabigasyon",
  "nav.announcements": "Mga Anunsyo",
  "nav.medical": "Medical History",
  "nav.maternal": "Maternal Records",
  "nav.philpen": "PhilPEN",
  "nav.immunization": "Bakuna",
  "nav.appointments": "Mga Appointment",
  "nav.notifications": "Mga Abiso",
  "nav.concern": "Reklamo sa Kalusugan",
  "nav.digitalId": "Digital ID",
  "nav.personal": "Personal na Impormasyon",
  "nav.changePassword": "Palitan ang Password",
  "nav.overview": "Pangkalahatan",
  "nav.reports": "Mga Ulat",
  "nav.residents": "Mga Rehistradong Residente",
  "nav.addResident": "Magdagdag ng Residente",
  "nav.bmi": "BMI Records",
  "nav.diagnose": "Suriin ang Pasyente",
  "nav.referrals": "Mga Referral",
  "nav.referredResident": "Na-refer na Residente",
  "nav.logbook": "Logbook",
  "nav.scanQr": "I-scan ang QR",
  "nav.manageAnnouncements": "Pamahalaan ang mga Anunsyo",
  "nav.archivedResidents": "Naka-archive na Residente",
  "nav.createUser": "Gumawa ng User",
  "nav.staffUsers": "Mga Staff User",
  "nav.activityLogs": "Activity Logs",
  "nav.residentsShort": "Mga Residente",
  "nav.staff": "Staff",
  "nav.createBarangay": "Gumawa ng Barangay",
  "nav.barangayAdmins": "Mga Barangay Admin",
  "nav.logout": "Mag-log Out",

  "dup.title": "Posibleng dobleng residente",
  "dup.body":
    "May residente nang may parehong pangalan at petsa ng kapanganakan. Mangyaring suriin bago magrehistro muli.",
  "dup.proceed": "Magrehistro pa rin",
  "dup.cancel": "Kanselahin",
};

const DICTS: Record<Lang, Dict> = { en, ceb, fil };

const STORAGE_KEY = "kalyo_lang";

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && (saved === "en" || saved === "ceb" || saved === "fil")) {
        setLangState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string) => DICTS[lang]?.[key] ?? DICTS.en[key] ?? key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
