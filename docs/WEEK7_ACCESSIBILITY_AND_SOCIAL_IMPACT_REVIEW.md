# WEEK 7 DELIVERABLES: SERVICE-LEARNING, ACCESSIBILITY, INCLUSIVITY, AND SOCIAL IMPACT REVIEW

**Course:** Social and Professional Issues in IT  
**Week / Topic:** Week 7 — Service-Learning: Accessibility, Inclusivity, and Social Impact  
**Project Name:** Barangay Health System Blockchain (BHCMS)  
**Repository Path:** `c:\Users\jlvil\barangay-blockchain-system`  
**Target Community / Beneficiaries:** Barangay Health Workers (BHWs), Local Barangay Residents, Municipal Health Officers, Senior Citizens, and Rural Community Members.

---

## OVERVIEW OF DELIVERABLES

This unified document fulfills all three interconnected deliverables for Week 7:
1. **Part A:** WCAG-Based Accessibility Checklist (Team Output — Day 1)
2. **Part B:** Accessibility & Social Impact Review (Team Output — Day 2, Graded)
3. **Part C:** Reflection Journal Entry 4 (Individual Output — Day 2)

---

# PART A — WCAG-BASED ACCESSIBILITY CHECKLIST (TEAM, DAY 1)

### What is this for?
This checklist serves as the empirical testing tool to evaluate the **Barangay Health System Blockchain (BHCMS)** web application against the 4 core WCAG **POUR** principles (**Perceivable, Operable, Understandable, Robust**). Testing was conducted directly on the application UI, mobile views (`MobileBottomNav.tsx`, `QrScannerTab.tsx`), and offline capability features.

---

### 1. Checklist Evaluation Table

| Checklist Item # | POUR Principle | Checklist Item Description | Rating (Yes / No / Partial) | What did you observe? (Evidence / Notes) |
| :--- | :--- | :--- | :--- | :--- |
| **Item 1** | **Perceivable** | Images/icons have text descriptions (alt text) or labels. | **Partial** | Lucide React icons (`<QrCode />`, `<Shield />`, `<AlertCircle />`) in components like `QrScannerTab.tsx` and `MobileBottomNav.tsx` have visible labels in navigation tabs. However, several decorative icons in dashboard summary cards lack explicit `aria-hidden="true"` attributes or fallback text labels for screen readers. |
| **Item 2** | **Perceivable** | Text has strong enough color contrast against the background. | **Partial** | Primary headers (`slate-900`) and body text (`slate-700`) achieve a 7:1 contrast ratio exceeding WCAG AA standards. However, secondary metadata text using `slate-400` and muted badge labels in `sky-600` over light blue (`bg-sky-50`) drop below the 4.5:1 ratio requirement under bright outdoor sunlight in barangay health stations. |
| **Item 3** | **Perceivable** | Font size is readable without zooming in. | **Partial** | Standard body text is clear (14px–16px). However, navigation label text in `MobileBottomNav.tsx` uses `text-[10px]` (~10px font size), which is difficult to read for older Barangay Health Workers (BHWs) or users with mild visual impairment without zooming. |
| **Item 4** | **Operable** | All buttons/links can be reached and used without needing a mouse (touch or keyboard works fine). | **Yes** | All interactive controls use semantic HTML `<button>` and `<a>` elements with visible focus rings (`ring-sky-500`), permitting full navigation via Keyboard `Tab` key and touch screen inputs on mobile devices. |
| **Item 5** | **Operable** | Tap targets (buttons) are large enough for users with less precise motor control (e.g., elderly). | **Yes** | Mobile navigation buttons in `MobileBottomNav.tsx` explicitly enforce `minHeight: 56px`, exceeding the WCAG 48x48px requirement. Action buttons in forms and QR scanner gates also maintain generous padding for easy tapping. |
| **Item 6** | **Operable** | Users are not forced into a strict time limit to finish an action. | **Yes** | Sessions do not forcefully auto-logout or erase form progress during record entry. BHWs conducting home visitations or patient intake can complete entries at their own pace without risk of timed session expiry. |
| **Item 7** | **Understandable** | Instructions and labels use simple, plain language (no unexplained jargon). | **Partial** | General patient workflows use plain language. However, administrative and verification views feature technical blockchain terms (e.g., *"Immutable Ledger Hash"*, *"Cryptographic Audit Trail"*, *"Merkle Root"*) without localized Tagalog/Bisaya explanations or plain-language tooltips for non-technical community staff. |
| **Item 8** | **Understandable** | Error messages clearly explain what went wrong and what to do next. | **Yes** | Error handling in `QrScannerTab.tsx` provides clear, actionable instructions (e.g., *"Camera permission denied. Click the camera icon in your browser's address bar and allow access, then reload"*) rather than raw code exceptions or cryptic error codes. |
| **Item 9** | **Robust** | The system still works reasonably well on an older phone or slower internet connection. | **Yes** | Built as a Progressive Web App (PWA) with Next.js client caching and local database fallbacks. BHWs can record consultations and scan resident QR passes even in low-bandwidth or offline rural barangay environments. |
| **Item 10** | **Robust** | The system is usable with common assistive tools (e.g., screen reader, larger text setting). | **Partial** | The layout responds cleanly to browser text zoom up to 150%. However, dynamic elements like the live QR code scanner library do not emit screen reader notifications (`aria-live="polite"`) when a QR code is successfully captured. |

---

# PART B — ACCESSIBILITY AND SOCIAL IMPACT REVIEW (TEAM, DAY 2, GRADED)

## 1. Executive Summary & System Overview
The **Barangay Health System Blockchain (BHCMS)** is a community-focused digital health records and verification platform designed for local government units (LGUs). It serves Barangay Health Workers (BHWs), barangay captains, municipal health officers, and local residents. While the system incorporates modern security, blockchain ledger auditing, and PWA offline capabilities, ensuring accessibility and social inclusivity is critical to guarantee that no resident or health worker is left behind due to physical disabilities, age, low digital literacy, or technological constraints.

---

## 2. Detailed Identification of Accessibility & Usability Barriers

Based on our empirical evaluation in Part A, we identified three major candidate barriers:

### Barrier 1: Small Font Sizes and Sub-Optimal Color Contrast in Field Conditions (POUR: Perceivable)
* **Description:** Navigation subtext (`text-[10px]`) in `MobileBottomNav.tsx` and muted gray metadata (`slate-400`) produce contrast ratios below 4.5:1 on outdoor screens.
* **Impacted Stakeholders:** Elderly Barangay Health Workers (BHWs), senior citizen residents checking their digital health IDs under direct sunlight during community medical missions.
* **Root Cause:** Aesthetic design choices prioritizing compact mobile layout over high-contrast legibility guidelines.

### Barrier 2: Technical Cryptographic Jargon in User Interfaces (POUR: Understandable)
* **Description:** Blockchain status banners display terms like *"Block Hash 0x7f8... Verified"* and *"Cryptographic Nonce"*.
* **Impacted Stakeholders:** Grassroots BHWs and community residents with basic digital literacy.
* **Impact:** Causes user anxiety, fear of system error, and lack of trust in digital record verification.

### Barrier 3: Lack of Screen Reader Live Region Feedback on Dynamic Interactions (POUR: Robust)
* **Description:** Interactive features like the camera QR scanner in `QrScannerTab.tsx` do not announce status updates via screen reader ARIA live regions when a QR code scan succeeds or fails.
* **Impacted Stakeholders:** Visually impaired residents or health staff relying on screen readers (e.g., NVDA, TalkBack, VoiceOver).

---

## 3. Social Impact Analysis on Target Stakeholders

### A. Impact on Barangay Health Workers (BHWs)
* BHWs are often middle-aged or elderly community volunteers with varying levels of formal digital training.
* Intuitive UI, larger touch targets (`minHeight: 56px`), offline caching, and plain-language guidance empower BHWs to transition from tedious paper logbooks to digital records without tech-induced stress.

### B. Impact on Senior Citizens & Vulnerable Residents
* Senior citizens constitute a high-frequency demographic for barangay health services (hypertension monitoring, maintenance medicine distribution).
* Clear visual hierarchy, readable fonts, and simple QR-based identification eliminate long queues and prevent misidentification in barangay health centers.

### C. Impact on Rural & Low-Connectivity Communities
* Internet connectivity in provincial barangay stations is frequently unstable.
* The system's offline PWA capability ensures equal quality of healthcare delivery, ensuring that rural residents receive the same speed of service as urban barangay residents.

---

## 4. Inclusivity & Ethical Considerations
* **Digital Divide & Equitable Access:** Technology should act as an equalizer, not an added barrier. Relying solely on high-end smartphones or high-speed 5G would marginalize low-income barangay households. BHCMS addresses this by supporting printed QR IDs and low-spec mobile browser compatibility.
* **Data Privacy & Dignity:** Patient health data is sensitive. Transparent authorization dialogs (`SecureScanGate.tsx`) ensure residents retain ownership and dignity over their medical histories.

---

## 5. Actionable Remediation & Action Plan

| Priority | Targeted Barrier | Proposed Remediation / Action Item | Responsible Role | Target Timeline |
| :--- | :--- | :--- | :--- | :--- |
| **High** | Font Size & Contrast | Increase mobile nav label text from `10px` to `12px/14px`. Upgrade metadata text colors from `slate-400` to high-contrast `slate-600`/`slate-700`. | Frontend Lead | Sprint 1 (Day 3) |
| **High** | Cryptographic Jargon | Replace technical jargon with plain language (e.g., replace *"Cryptographic Ledger Hash"* with *"Verified Tamper-Proof Official Record ✓"*). Add Bisaya/Tagalog tooltips. | UX Writer / Dev | Sprint 1 (Day 4) |
| **Medium**| Screen Reader Live Regions | Add `aria-live="polite"` and `role="status"` containers to `QrScannerTab.tsx` so screen readers announce successful QR scans aloud. | Accessibility Specialist | Sprint 2 (Day 5) |
| **Medium**| Icon Accessibility | Add explicit `aria-hidden="true"` to decorative icons and `aria-label` attributes to icon-only buttons. | Frontend Dev | Sprint 2 (Day 6) |

---

# PART C — REFLECTION JOURNAL ENTRY 4 (INDIVIDUAL OUTPUT)

**Student Name:** [Your Name / Student ID]  
**Course & Section:** Social and Professional Issues in IT — Section [Your Section]  
**Date:** August 5, 2026  

---

### 1. Key Learnings & Personal Insights
Conducting this Accessibility and Social Impact Review for our capstone project, the **Barangay Health System Blockchain (BHCMS)**, was an eye-opening experience. As developers, we often build software assuming our end-users have modern devices, high-speed internet, crisp vision, and high tech-literacy. 

Testing our system against the 4 WCAG POUR principles forced me to step into the shoes of our actual end-users: elderly Barangay Health Workers (BHWs) conducting field visits under bright sunlight, senior citizens scanning digital health passes, and rural residents with limited bandwidth. Realizing that small font sizes (`10px`) or complex blockchain jargon could cause frustration or prevent someone from receiving timely healthcare was a powerful lesson in empathy-driven software engineering.

---

### 2. Paradigm Shift on Inclusive Technology Design
Prior to this review, I viewed accessibility as a compliance checkbox or a nice-to-have visual polish added at the end of development. I now realize that **accessibility is a fundamental human right and a core ethical responsibility in IT**. 

When building public sector systems—especially local government and community health platforms—an inaccessible UI directly excludes vulnerable citizens. Security and blockchain immutability mean very little if a BHW cannot read the screen or navigate the form on a low-end mobile phone. True technical excellence requires both robust engineering and inclusive UX design.

---

### 3. Future Professional Commitments
As a future IT professional, I commit to embedding accessibility and social impact analysis into every stage of the software development lifecycle:
1. **Design for All from Day One:** I will incorporate WCAG AA standards (contrast ratios, tap targets, screen reader support) during the initial design and wireframing phase, rather than as an afterthought.
2. **Prioritize Plain Language & Localization:** I will advocate for jargon-free, localized interfaces (including regional languages like Tagalog and Bisaya) to bridge the digital literacy gap in local communities.
3. **Conduct Real-World User Testing:** I will actively engage diverse user groups—including senior citizens and users with visual or motor impairments—during user acceptance testing to validate real-world usability.
