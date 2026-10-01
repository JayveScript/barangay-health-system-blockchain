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

  // Change password
  "cp.title": "Change Password",
  "cp.subtitle": "Verify with a code sent to your Gmail, then set a new password.",
  "cp.info": "We'll email a 6-digit verification code to the Gmail on your account. You'll need it to set a new password.",
  "cp.send": "Send Code to My Gmail",
  "cp.sending": "Sending code...",
  "cp.sentPrefix": "Code sent to",
  "cp.sentSuffix": "Enter it below.",
  "cp.code": "Verification Code",
  "cp.codePh": "6-digit code",
  "cp.newPw": "New Password",
  "cp.newPwPh": "At least 8 characters",
  "cp.confirmPw": "Confirm New Password",
  "cp.confirmPwPh": "Re-enter new password",
  "cp.resend": "Resend code",
  "cp.saving": "Saving...",
  "cp.submit": "Change Password",
  "cp.doneTitle": "Password changed",
  "cp.doneBody": "For security, please log in again with your new password.",
  "cp.goLogin": "Go to Login",
  "cp.errSend": "Unable to send the code.",
  "cp.errConnect": "Unable to connect to the server.",
  "cp.errCode": "Enter the verification code from your email.",
  "cp.errPwLen": "New password must be at least 8 characters.",
  "cp.errPwMatch": "Passwords do not match.",
  "cp.errChange": "Unable to change your password.",

  // QR scanner
  "qr.title": "Scan Resident QR",
  "qr.subtitle": "Point your camera at the resident's Digital ID QR code. You will verify your password before any health data is shown.",
  "qr.detected": "QR detected! Opening secure verification...",
  "qr.unrecognized": "Unrecognized QR code. Please scan a valid resident Digital ID.",
  "qr.poweredBy": "Powered by Barangay Health Portal",

  // Overview (staff dashboards)
  "ov.overview": "Overview",
  "ov.totalResidents": "Total Residents",
  "ov.verifiedResidents": "Verified Residents",
  "ov.otherNotSet": "Other / Not Set",
  "ov.sexDist": "Resident Sex Distribution",
  "ov.sexDistSub": "Male, female, and other registered residents",
  "ov.ageDist": "Age Group Distribution",
  "ov.ageDistSub": "Resident population by age group",
  "ov.activity": "Health Center Activity",
  "ov.activitySub": "A summary across registration, referrals, logbook, BMI, and announcements.",
  "ov.pendingReg": "Pending Registrations",
  "ov.awaitingVerification": "Awaiting verification",
  "ov.referralsReceived": "Referrals Received",
  "ov.pending": "pending",
  "ov.referralsSent": "Referrals Sent",
  "ov.toOtherBarangays": "To other barangays",
  "ov.logbookVisits": "Logbook Visits",
  "ov.today": "today",
  "ov.bmiRecords": "BMI Records",
  "ov.announcements": "Announcements",
  "ov.postedInBarangay": "Posted in barangay",
  "ov.loadingStats": "Loading resident statistics...",
  "ov.errStats": "Failed to load statistics.",
  "ov.errConnect": "Unable to connect to the server.",
  "ov.loadingOverview": "Loading overview data...",
  "ov.male": "Male",
  "ov.female": "Female",
  "ov.hypertension": "Hypertension",
  "ov.diabetes": "Diabetes",
  "ov.heartDisease": "Heart Disease",
  "ov.tuberculosis": "Tuberculosis",
  "ov.allergies": "Allergies",
  "ov.cancer": "Cancer",
  "ov.statusPending": "Pending",
  "ov.statusAccepted": "Accepted",
  "ov.statusRejected": "Rejected",
  // Doctor overview
  "ov.doc.medicalRecords": "Medical Records",
  "ov.doc.totalAppointments": "Total Appointments",
  "ov.doc.openSlots": "Open Slots",
  "ov.doc.bookedSlots": "Booked Slots",
  "ov.doc.totalSlots": "Total Slots",
  "ov.doc.postedSchedules": "Posted Schedules",
  "ov.doc.genderTitle": "Resident Gender Overview",
  "ov.doc.genderSub": "Male, female, and other resident records",
  "ov.doc.apptTitle": "Appointment Status",
  "ov.doc.apptSub": "Pending, accepted, and rejected appointment requests",
  "ov.doc.condTitle": "Common Medical Conditions",
  "ov.doc.condSub": "Based on resident medical history records",
  "ov.doc.slotTitle": "Slot Usage Overview",
  "ov.doc.slotSub": "Booked and available doctor appointment slots",
  "ov.doc.clinicalTitle": "Health Center Clinical Summary",
  "ov.doc.clinicalSub": "Connected doctor monitoring overview",

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

  "cp.title": "Usba ang Password",
  "cp.subtitle": "Pag-verify gamit ang code nga ipadala sa imong Gmail, dayon pagbutang og bag-ong password.",
  "cp.info": "Magpadala mi og 6-digit nga verification code sa Gmail sa imong account. Kinahanglan nimo kini aron makabutang og bag-ong password.",
  "cp.send": "Ipadala ang Code sa akong Gmail",
  "cp.sending": "Gipadala ang code...",
  "cp.sentPrefix": "Napadala ang code sa",
  "cp.sentSuffix": "Isulod kini sa ubos.",
  "cp.code": "Verification Code",
  "cp.codePh": "6-digit nga code",
  "cp.newPw": "Bag-ong Password",
  "cp.newPwPh": "Labing minos 8 ka karakter",
  "cp.confirmPw": "Kumpirma ang Bag-ong Password",
  "cp.confirmPwPh": "Isulod pag-usab ang bag-ong password",
  "cp.resend": "Ipadala pag-usab ang code",
  "cp.saving": "Gina-save...",
  "cp.submit": "Usba ang Password",
  "cp.doneTitle": "Nausab ang password",
  "cp.doneBody": "Para sa seguridad, palihog sulod pag-usab gamit ang imong bag-ong password.",
  "cp.goLogin": "Adto sa Login",
  "cp.errSend": "Dili makapadala sa code.",
  "cp.errConnect": "Dili makakonekta sa server.",
  "cp.errCode": "Isulod ang verification code gikan sa imong email.",
  "cp.errPwLen": "Ang bag-ong password kinahanglan labing minos 8 ka karakter.",
  "cp.errPwMatch": "Dili magkatugma ang mga password.",
  "cp.errChange": "Dili mausab ang imong password.",

  "qr.title": "I-scan ang QR sa Residente",
  "qr.subtitle": "Itutok ang imong camera sa QR code sa Digital ID sa residente. I-verify una nimo ang imong password una ipakita ang bisan unsang health data.",
  "qr.detected": "Nakita ang QR! Gina-abli ang secure nga verification...",
  "qr.unrecognized": "Dili mailhan nga QR code. Palihog pag-scan og balido nga Digital ID sa residente.",
  "qr.poweredBy": "Gipadagan sa Barangay Health Portal",

  "ov.overview": "Kinatibuk-an",
  "ov.totalResidents": "Tanang Residente",
  "ov.verifiedResidents": "Verified nga Residente",
  "ov.otherNotSet": "Uban / Wala Na-set",
  "ov.sexDist": "Pagbahin sa Sekso sa Residente",
  "ov.sexDistSub": "Lalaki, babaye, ug ubang narehistrong residente",
  "ov.ageDist": "Pagbahin sa Pangidaron",
  "ov.ageDistSub": "Populasyon sa residente pinaagi sa grupo sa edad",
  "ov.activity": "Kalihokan sa Health Center",
  "ov.activitySub": "Sumada sa rehistrasyon, referral, logbook, BMI, ug mga pahibalo.",
  "ov.pendingReg": "Nagpaabot nga Rehistrasyon",
  "ov.awaitingVerification": "Naghulat og verification",
  "ov.referralsReceived": "Nadawat nga Referral",
  "ov.pending": "nagpaabot",
  "ov.referralsSent": "Gipadala nga Referral",
  "ov.toOtherBarangays": "Ngadto sa ubang barangay",
  "ov.logbookVisits": "Mga Bisita sa Logbook",
  "ov.today": "karon",
  "ov.bmiRecords": "BMI Records",
  "ov.announcements": "Mga Pahibalo",
  "ov.postedInBarangay": "Gi-post sa barangay",
  "ov.loadingStats": "Gina-load ang estadistika sa residente...",
  "ov.errStats": "Napakyas sa pag-load sa estadistika.",
  "ov.errConnect": "Dili makakonekta sa server.",
  "ov.loadingOverview": "Gina-load ang datos sa overview...",
  "ov.male": "Lalaki",
  "ov.female": "Babaye",
  "ov.hypertension": "Hypertension",
  "ov.diabetes": "Diabetes",
  "ov.heartDisease": "Sakit sa Kasingkasing",
  "ov.tuberculosis": "Tuberculosis",
  "ov.allergies": "Allergy",
  "ov.cancer": "Kanser",
  "ov.statusPending": "Nagpaabot",
  "ov.statusAccepted": "Gidawat",
  "ov.statusRejected": "Gibalibaran",
  "ov.doc.medicalRecords": "Medical Records",
  "ov.doc.totalAppointments": "Tanang Appointment",
  "ov.doc.openSlots": "Bakanteng Slot",
  "ov.doc.bookedSlots": "Na-book nga Slot",
  "ov.doc.totalSlots": "Tanang Slot",
  "ov.doc.postedSchedules": "Gi-post nga Iskedyul",
  "ov.doc.genderTitle": "Overview sa Sekso sa Residente",
  "ov.doc.genderSub": "Lalaki, babaye, ug uban nga records sa residente",
  "ov.doc.apptTitle": "Status sa Appointment",
  "ov.doc.apptSub": "Nagpaabot, gidawat, ug gibalibaran nga mga hangyo sa appointment",
  "ov.doc.condTitle": "Komon nga mga Kondisyon sa Panglawas",
  "ov.doc.condSub": "Base sa medical history records sa residente",
  "ov.doc.slotTitle": "Overview sa Paggamit sa Slot",
  "ov.doc.slotSub": "Na-book ug bakanteng mga slot sa appointment sa doktor",
  "ov.doc.clinicalTitle": "Clinical Summary sa Health Center",
  "ov.doc.clinicalSub": "Konektado nga overview sa pag-monitor sa doktor",

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

  "cp.title": "Palitan ang Password",
  "cp.subtitle": "Mag-verify gamit ang code na ipapadala sa iyong Gmail, pagkatapos ay maglagay ng bagong password.",
  "cp.info": "Magpapadala kami ng 6-digit na verification code sa Gmail ng iyong account. Kakailanganin mo ito para makapaglagay ng bagong password.",
  "cp.send": "Ipadala ang Code sa aking Gmail",
  "cp.sending": "Ipinapadala ang code...",
  "cp.sentPrefix": "Naipadala ang code sa",
  "cp.sentSuffix": "Ilagay ito sa ibaba.",
  "cp.code": "Verification Code",
  "cp.codePh": "6-digit na code",
  "cp.newPw": "Bagong Password",
  "cp.newPwPh": "Hindi bababa sa 8 karakter",
  "cp.confirmPw": "Kumpirmahin ang Bagong Password",
  "cp.confirmPwPh": "Muling ilagay ang bagong password",
  "cp.resend": "Muling ipadala ang code",
  "cp.saving": "Sine-save...",
  "cp.submit": "Palitan ang Password",
  "cp.doneTitle": "Napalitan ang password",
  "cp.doneBody": "Para sa seguridad, mangyaring mag-log in muli gamit ang iyong bagong password.",
  "cp.goLogin": "Pumunta sa Login",
  "cp.errSend": "Hindi maipadala ang code.",
  "cp.errConnect": "Hindi makakonekta sa server.",
  "cp.errCode": "Ilagay ang verification code mula sa iyong email.",
  "cp.errPwLen": "Ang bagong password ay dapat hindi bababa sa 8 karakter.",
  "cp.errPwMatch": "Hindi magkatugma ang mga password.",
  "cp.errChange": "Hindi mapalitan ang iyong password.",

  "qr.title": "I-scan ang QR ng Residente",
  "qr.subtitle": "Itutok ang iyong camera sa QR code ng Digital ID ng residente. Beberipikahin mo muna ang iyong password bago ipakita ang anumang health data.",
  "qr.detected": "Nakita ang QR! Binubuksan ang secure na verification...",
  "qr.unrecognized": "Hindi makilalang QR code. Mangyaring mag-scan ng wastong Digital ID ng residente.",
  "qr.poweredBy": "Pinatatakbo ng Barangay Health Portal",

  "ov.overview": "Pangkalahatan",
  "ov.totalResidents": "Kabuuang Residente",
  "ov.verifiedResidents": "Verified na Residente",
  "ov.otherNotSet": "Iba / Hindi Naka-set",
  "ov.sexDist": "Distribusyon ng Kasarian ng Residente",
  "ov.sexDistSub": "Lalaki, babae, at iba pang rehistradong residente",
  "ov.ageDist": "Distribusyon ayon sa Edad",
  "ov.ageDistSub": "Populasyon ng residente ayon sa grupo ng edad",
  "ov.activity": "Aktibidad ng Health Center",
  "ov.activitySub": "Buod ng rehistrasyon, referral, logbook, BMI, at mga anunsyo.",
  "ov.pendingReg": "Nakabinbing Rehistrasyon",
  "ov.awaitingVerification": "Naghihintay ng verification",
  "ov.referralsReceived": "Natanggap na Referral",
  "ov.pending": "nakabinbin",
  "ov.referralsSent": "Naipadalang Referral",
  "ov.toOtherBarangays": "Sa ibang barangay",
  "ov.logbookVisits": "Mga Bisita sa Logbook",
  "ov.today": "ngayon",
  "ov.bmiRecords": "BMI Records",
  "ov.announcements": "Mga Anunsyo",
  "ov.postedInBarangay": "Nai-post sa barangay",
  "ov.loadingStats": "Nilo-load ang estadistika ng residente...",
  "ov.errStats": "Nabigong i-load ang estadistika.",
  "ov.errConnect": "Hindi makakonekta sa server.",
  "ov.loadingOverview": "Nilo-load ang datos ng overview...",
  "ov.male": "Lalaki",
  "ov.female": "Babae",
  "ov.hypertension": "Hypertension",
  "ov.diabetes": "Diabetes",
  "ov.heartDisease": "Sakit sa Puso",
  "ov.tuberculosis": "Tuberculosis",
  "ov.allergies": "Allergy",
  "ov.cancer": "Kanser",
  "ov.statusPending": "Nakabinbin",
  "ov.statusAccepted": "Tinanggap",
  "ov.statusRejected": "Tinanggihan",
  "ov.doc.medicalRecords": "Medical Records",
  "ov.doc.totalAppointments": "Kabuuang Appointment",
  "ov.doc.openSlots": "Bakanteng Slot",
  "ov.doc.bookedSlots": "Naka-book na Slot",
  "ov.doc.totalSlots": "Kabuuang Slot",
  "ov.doc.postedSchedules": "Nai-post na Iskedyul",
  "ov.doc.genderTitle": "Overview ng Kasarian ng Residente",
  "ov.doc.genderSub": "Lalaki, babae, at iba pang records ng residente",
  "ov.doc.apptTitle": "Status ng Appointment",
  "ov.doc.apptSub": "Nakabinbin, tinanggap, at tinanggihang mga kahilingan sa appointment",
  "ov.doc.condTitle": "Karaniwang mga Kondisyong Medikal",
  "ov.doc.condSub": "Batay sa medical history records ng residente",
  "ov.doc.slotTitle": "Overview ng Paggamit ng Slot",
  "ov.doc.slotSub": "Naka-book at bakanteng mga slot sa appointment ng doktor",
  "ov.doc.clinicalTitle": "Clinical Summary ng Health Center",
  "ov.doc.clinicalSub": "Konektadong overview ng pagmo-monitor ng doktor",

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
