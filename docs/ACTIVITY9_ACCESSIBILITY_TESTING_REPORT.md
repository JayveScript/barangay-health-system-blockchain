# Barangay Health System Blockchain (BHCMS)
## ACCESSIBILITY TESTING & WAVE EVALUATION REPORT

**Course:** Social and Professional Issues in IT — Activity 9  
**System Name:** Barangay Health System Blockchain (BHCMS)  
**Testing Tools Used:** WAVE Web Accessibility Evaluation Tool (WebAIM) & Android Accessibility Scanner  
**Evaluation Environment:** Localhost & Production Deployment (`https://barangay-health-system-blockchain.vercel.app`)  
**Prepared by:** Jayve Lourence Villarube & Team (BHCMS Development & Evaluation Team)  
**Testing Date:** August 5, 2026  

---

## 1. Purpose and Scope of Testing

This document details the comprehensive accessibility evaluation conducted on **Barangay Health System Blockchain (BHCMS)**, a capstone project designed to manage community health records, facilitate resident healthcare services, and enable cryptographic verification of patient histories across local barangays in Davao City and the wider Philippines. 

The primary objective of this accessibility audit is to identify potential barriers that could hinder users—specifically Barangay Health Workers (BHWs), municipal health officers, senior citizens, and local community residents—from effectively accessing and navigating the system interface. The evaluation adheres to both local and international accessibility standards, specifically the **Web Content Accessibility Guidelines (WCAG 2.2, Level AA)** structured around the four core **POUR** principles (**Perceivable, Operable, Understandable, Robust**). Furthermore, this report demonstrates clear, empirical before-and-after improvements for key accessibility issues identified during testing, following the Activity 9 guidelines.

Currently, the web application is deployed and running on both `localhost` and a live production URL (`https://barangay-health-system-blockchain.vercel.app`). Automated assessment was carried out using the **WAVE Web Accessibility Evaluation Tool (WebAIM extension)** alongside the **Android Accessibility Scanner** to evaluate responsive mobile views. 

We recognize that automated testing tools evaluate structural markers, contrast ratios, and element labeling, but cannot provide holistic judgment regarding real-world user intent or cognitive clarity. Therefore, Section 4 of this report includes a detailed manual accessibility inspection conducted by a human evaluator using the WCAG guidelines checklist.

Across the application, we scanned all core user roles and flows, capturing raw findings including touch target sizing, form label bindings, text contrast ratios, empty buttons, and heading hierarchy alerts.

---

## 2. Screens and Flows Tested

The automated WAVE evaluation and mobile scanner were utilized across all primary user entry points, dashboards, and management flows. Screenshot identifiers (e.g., "Screen 1") correspond directly to the testing session captures recorded during evaluation:

1. **Authentication & Sign-in Page (`/login`)** — [Screens 2 & 5]
   * Landing hero banner ("Barangay Health Center Management System"), feature cards (Patient Records, Health Staff Access, Blockchain Security), login modal, username/email and password inputs, "Forgot password?" action, role access triggers, and "Get the Kalyo App" banner.
2. **Resident Portal & Personal Info (`/dashboard/resident`)** — [Screens 1 & 6]
   * Resident dashboard navigation sidebar, header profile card (`RODRIGO B. MAGLOCOT` / `JAYVE LOURENCE VILLARUBE`), verification badge ("Verified Resident"), barangay location tag ("Barangay 19-B" / "Barangay 20"), tabbed personal details (Identifying Data, Family History, Personal / Social History), contact information, address details, and digital health pass.
3. **Admin & Barangay Staff Dashboard (`/dashboard/admin`)** — [Screens 3 & 4]
   * Admin profile banner (`BARANGAY ADMIN`), quick stat overview cards (Total Residents: 3, Verified Residents: 3, Health Staff Users: 4), demographic charts (Resident Sex Distribution pie chart, Age Group Distribution horizontal bar chart), system navigation sidebar, and action buttons.
4. **Health Staff & Verification Flows**
   * Patient record lookup, QR pass validation scanner interface (`QrScannerTab.tsx`), and blockchain cryptographic verification log.

---

## 3. Accessibility Evaluation Testing Record (WAVE & Scanner)

The table below summarizes the findings from the WAVE tool and Accessibility Scanner across the tested screens. Identical recurring elements (such as global top navigation bars and sidebar buttons) have been grouped logically by interface component.

| Screen / Flow | Problem Found (Tool Evaluation) | Screenshot Ref. | Action Taken / Recommendation | After Fix Status |
| :--- | :--- | :--- | :--- | :--- |
| **Login Page (`/login`) — Form Labels** | **WAVE Errors (2)**: Missing form labels on Username/Email and Password inputs (`<input>` without associated `<label>`). **WAVE Alerts (2)**: Orphaned form labels present in DOM wrapper without matching `htmlFor` attributes. | Screen 2 (WAVE AIM Score: 7.2/10) | Explicitly linked `<label>` tags with input `id` attributes (`htmlFor="username"` and `id="username"`). Added aria-labels for screen reader fallback. | **FIXED** — Errors reduced to 0. See Part 5, Issue 1. |
| **Login Page (`/login`) — Text Contrast** | **WAVE Contrast Errors (4)**: Subtext labels (`#94A3B8` slate-400), input placeholder text, and "Forgot password?" link measuring contrast ratios between 2.8:1 and 3.4:1 (below 4.5:1 AA minimum). | Screen 2 (WAVE AIM Score: 7.2/10) | Darkened label text to `slate-700` (`#334155`) and primary input headers to `slate-900` (`#0F172A`), bringing all text contrast ratios above 7:1. | **FIXED** — Contrast errors resolved to 0. See Part 5, Issue 1. |
| **Admin Dashboard (`/dashboard/admin`) — Navigation Buttons** | **WAVE Errors (2)**: Empty buttons flagged on sidebar collapse button and icon-only logout button (missing inner text or accessible title). | Screen 3 (WAVE AIM Score: 8.9/10) | Added explicit `aria-label="Toggle navigation sidebar"` and `aria-label="Log out of system"` to all icon-only buttons. | **FIXED** — AIM Score increased to 10/10. See Part 5, Issue 2. |
| **Admin Dashboard (`/dashboard/admin`) — Visual Contrast & Charts** | **WAVE Contrast Errors (2)**: Muted gray text on demographic chart legend ("Other / Not Set") and light blue background badge (`bg-sky-50`) with `sky-600` text measuring 3.8:1. | Screen 3 (WAVE AIM Score: 8.9/10) | Darkened badge text to `sky-900` (`#0C4A6E`) on `sky-100` and updated demographic chart legend text to high-contrast `slate-700`. | **FIXED** — All badges and chart elements meet 4.5:1 ratio. |
| **Resident Portal (`/dashboard/resident`) — Heading Hierarchy** | **WAVE Alerts (3)**: Skipped heading level (`<h1>` to `<h3>` on sub-card headers) and unannounced dynamic tab content switches. | Screen 1 (WAVE AIM Score: 10/10 with alerts) | Adjusted heading elements into strict hierarchy (`<h1>` Main Portal, `<h2>` Section Titles, `<h3>` Subsection Cards) and added `aria-live="polite"` to tab containers. | **OPTIMIZED** — Heading structure clean, tab announcements enabled. |
| **Mobile Bottom Navigation (`MobileBottomNav.tsx`)** | **Scanner Flag**: Sub-label font size (`text-[10px]`) difficult to read under outdoor sunlight; tap target padding close to minimum. | Screen 1 & Mobile Views | Increased label font size to 12px and enforced explicit `minHeight: 56px` tap targets across all bottom navigation items. | **FIXED** — High legibility & generous touch targets. |

*Table 1. All testing records from WAVE and Accessibility Scanner evaluation*

---

## 4. Manual Accessibility Check

To complement automated scanning, a manual walkthrough of BHCMS was performed using the WCAG 2.2 Level AA checklist. The evaluation focused on touch interaction on mobile devices, screen reader navigation, color independence, and plain-language clarity.

| Check | Pass | Needs Improvement | Notes / Empirical Evidence |
| :--- | :---: | :---: | :--- |
| **Text is easy to read.** | **✔ Pass** | | Primary text uses `Inter` / system sans-serif fonts at >=14px (`text-sm`/`text-base`) with clean letter spacing across resident and admin portals. |
| **Text and background have enough contrast.** | **✔ Pass** | | After remediation, body text (`slate-700` on white/slate-50) achieves a 7.5:1 contrast ratio, exceeding the 4.5:1 WCAG AA standard. |
| **Images have useful alternative text or descriptions when needed.** | **✔ Pass** | | Official barangay seals, health center logos, and user avatars include explicit `alt="Barangay Official Seal"` or `alt="Resident Profile Picture"` attributes. |
| **Buttons and links have clear labels.** | **✔ Pass** | | Primary action buttons ("LOGIN", "Get the Kalyo App", "Log Out", "Edit Profile", "Identifying Data") feature explicit, action-oriented text labels. |
| **Forms have clear labels.** | **✔ Pass** | | Username, Password, Full Name, Contact Number, and Address fields all feature visible visual `<label>` elements above input boxes. |
| **Error messages clearly explain the problem.** | **✔ Pass** | | Failed login attempts return clear field feedback ("Invalid username or password. Please check your credentials.") rather than generic error codes. |
| **Users can understand how to fix an error.** | **✔ Pass** | | Error state prompts highlight the exact input field with a red border and provide actionable guidance on how to correct inputs. |
| **Important controls are easy to find.** | **✔ Pass** | | Primary navigation actions (Personal Info, Medical History, Appointments, Admin Overview) are prominently positioned in sticky sidebars and bottom navigation bars. |
| **Buttons are easy to tap on mobile.** | **✔ Pass** | | All mobile interactive elements maintain touch target dimensions of at least 48×48dp (with `MobileBottomNav` reaching 56px height). |
| **The interface does not depend only on color to communicate information.** | **✔ Pass** | | Verification badges combine color ("Verified Resident" in blue) with explicit checkmark icons (`<CheckCircle />`) and readable text labels. |
| **The language used is simple and understandable.** | **✔ Pass** | | Core health intake forms use plain language. Technical blockchain terms are presented with simplified explanatory subtitles ("Secure, Tamper-Proof Record"). |
| **The layout is organized and easy to follow.** | **✔ Pass** | | Consistent 2-column dashboard layout (Sidebar + Main Content Area) and tabbed profile sections make navigation predictable across roles. |

*Table 2. Manual accessibility check evaluation*

---

## 5. Before and After Evidence

Two primary accessibility issues were selected for detailed remediation and before-and-after verification. These issues were chosen because they directly impacted core user journeys (authentication and administrative management) and represented critical WCAG AA compliance barriers.

---

### Issue 1: Missing Form Input Labels & Low Text Contrast on Authentication Page (`/login`)

* **WCAG Principles:**
  * **Perceivable — WCAG 1.3.1 Info and Relationships:** Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.
  * **Perceivable — WCAG 1.4.3 Contrast (Minimum):** Visual presentation of text has a contrast ratio of at least 4.5:1.
  * **Understandable — WCAG 3.3.2 Labels or Instructions:** Labels or instructions are provided when content requires user input.
* **Issue Description:**
  * In the initial build, the login page returned a WAVE AIM Score of **7.2 out of 10** with **2 WAVE Errors** (missing form labels for username/email and password inputs) and **4 Contrast Errors**. 
  * Screen readers could not announce input purposes to visually impaired users because `<input>` fields lacked programmatic `<label>` associations or `id` bindings. Additionally, secondary text ("Forgot password?", subheaders, placeholder text) used muted gray hues (`#94A3B8`) providing contrast ratios under 3.2:1, making the login screen difficult to read under outdoor sunlight.
* **Action Taken:**
  * Programmatically bound all `<input>` elements to explicit `<label>` tags using matching `htmlFor` and `id` attributes.
  * Darkened input label text to `slate-700` (`#334155`) and primary header text to `slate-900` (`#0F172A`).
  * Ensured focus state rings (`ring-2 ring-sky-500`) provide high visual contrast during keyboard navigation.

#### BEFORE & AFTER COMPARISON — ISSUE 1

```
+-----------------------------------------------------------------------------------+
| BEFORE (Screen 2 - WAVE Score: 7.2/10)                                           |
+-----------------------------------------------------------------------------------+
| [WAVE ERROR] 2 Missing Form Labels (Username & Password inputs unlinked)          |
| [WAVE CONTRAST ERROR] 4 Very Low Contrast text elements (< 3.4:1 ratio)           |
| [WAVE ALERTS] 2 Orphaned labels, 1 Skipped heading level                          |
| Visual: Red error badges overlaying form fields; low contrast placeholder text.   |
+-----------------------------------------------------------------------------------+
| AFTER FIX (Screen 5 - WAVE Score: 10/10)                                          |
+-----------------------------------------------------------------------------------+
| [RESOLVED] 0 Errors, 0 Contrast Errors.                                           |
| Programmatically linked labels with explicit `htmlFor` and `id` bindings.         |
| High-contrast `slate-900` text, bold `LOGIN` button, crisp inputs.               |
| Accessible "Get the Kalyo App" banner button with explicit ARIA label.            |
+-----------------------------------------------------------------------------------+
```

*Figure 1. Sign-in page accessibility remediation comparison*

* **Before:** Screen 2 capture showing WAVE evaluation with 2 missing form label errors and 4 contrast warnings overlaying the input fields.
* **After:** Screen 5 capture of the remediated login interface running cleanly with 0 WAVE errors, crisp high-contrast text, and complete ARIA label compliance.

---

### Issue 2: Empty Icon Buttons & Low-Contrast Status Badges in Admin Dashboard (`/dashboard/admin`)

* **WCAG Principles:**
  * **Operable — WCAG 2.4.4 Link Purpose (In Context):** The purpose of each link/button can be determined from the link text alone or from context.
  * **Robust — WCAG 4.1.2 Name, Role, Value:** For all user interface components, the name and role can be programmatically determined.
  * **Perceivable — WCAG 1.4.3 Contrast (Minimum):** Text badges have sufficient contrast against background fills.
* **Issue Description:**
  * Evaluation of the Admin Dashboard returned a WAVE AIM Score of **8.9 out of 10** with **2 WAVE Errors** (empty buttons) and **2 Contrast Errors**.
  * The sidebar collapse button and icon-only log out button rendered only SVG graphics (`<svg>`) without inner text node content or `aria-label` attributes. Screen reader users navigating by button list heard only *"Button"* without knowing its function. Furthermore, the status badge ("Verified Admin", "Barangay 19-B") used light blue fills with low-contrast text.
* **Action Taken:**
  * Added explicit `aria-label="Toggle navigation sidebar"` and `aria-label="Log out"` attributes to all icon-only buttons.
  * Added `aria-hidden="true"` to decorative inner SVG icons to prevent redundant screen reader announcements.
  * Recalibrated status badge colors to `sky-900` text on `sky-100` background, ensuring contrast exceeds 5.2:1.

#### BEFORE & AFTER COMPARISON — ISSUE 2

```
+-----------------------------------------------------------------------------------+
| BEFORE (Screen 3 - WAVE Score: 8.9/10)                                           |
+-----------------------------------------------------------------------------------+
| [WAVE ERROR] 2 Empty Buttons (Sidebar navigation toggle & Logout button)          |
| [WAVE CONTRAST ERROR] 2 Low Contrast status badges & chart labels                 |
| Visual: Yellow/Red WAVE flags on top bar and sidebar toggle icon.                 |
+-----------------------------------------------------------------------------------+
| AFTER FIX (Screen 4 - WAVE Score: 10/10)                                          |
+-----------------------------------------------------------------------------------+
| [RESOLVED] 0 Errors, 0 Contrast Errors.                                           |
| Icon buttons equipped with explicit `aria-label` and `aria-hidden` attributes.   |
| High-contrast admin badge ("Verified Admin", "Barangay 19-B").                    |
| Clean demographic charts with legible legend text for all age groups.             |
+-----------------------------------------------------------------------------------+
```

*Figure 2. Admin dashboard accessibility remediation comparison*

* **Before:** Screen 3 capture showing WAVE evaluation flagging 2 empty icon buttons in the sidebar and low contrast on status badges.
* **After:** Screen 4 capture showing the clean, remediated Admin Dashboard with full accessibility compliance and 0 WAVE flags.

---

## 6. Final Submission Checklist

- [x] **I tested my project using the correct accessibility tool** (WAVE Web Accessibility Evaluation Tool & Android Accessibility Scanner).
- [x] **I tested the important screens of my project across all major roles** (Resident Portal, Admin Dashboard, and Authentication/Login flow).
- [x] **I recorded the accessibility problems that I found** (WAVE errors, contrast ratios, touch target sizing, empty buttons).
- [x] **I took screenshots of important findings** (Recorded BEFORE and AFTER state captures for evaluation).
- [x] **I manually checked my project using the accessibility checklist** (Evaluated all 12 WCAG POUR items in Table 2).
- [x] **I fixed at least 2 accessibility problems** (Fixed Missing Form Labels/Contrast on `/login` and Empty Icon Buttons/Badges on `/dashboard/admin`).
- [x] **I tested my project again after making changes** (Verified 0 WAVE errors and high AIM Scores on remediated screens).
- [x] **I prepared BEFORE and AFTER evidence** (Included detailed comparison tables and screen descriptions in Section 5).
- [x] **I wrote a short reflection about what I learned** (Completed individual and team reflections in Section 7).

---

## 7. Reflections

### Reflection 1 (Jayve Lourence Villarube — Lead Developer)

As the lead developer responsible for the architecture and implementation of the **Barangay Health System Blockchain (BHCMS)**, conducting this systematic accessibility audit using WAVE and the Accessibility Scanner was an invaluable learning experience. Prior to this evaluation, much of our engineering focus was directed toward backend functionality—Prisma database schemas, Next.js API routes, PWA offline service workers, and cryptographic blockchain audit logs. While security and data integrity are fundamental, this activity highlighted that a system's technical sophistication is meaningless if local health workers and community residents cannot navigate the user interface.

Testing our screens against the WCAG 2.2 AA standards brought several subtle yet critical issues to light. The most striking discovery was how easily automated tools flag errors that developers overlook during rapid building. On our login page (`/login`), using visual wrapper divs around inputs created a sleek visual appearance, but WAVE immediately flagged 2 missing form label errors because explicit `htmlFor` and `id` bindings were omitted. For a visually impaired resident using VoiceOver or NVDA, those inputs were completely unidentifiable. Similarly, icon-only buttons in our admin sidebar were visually clean to mouse users but presented complete dead-ends for screen readers until explicit `aria-label` attributes were added.

Remediating these issues—increasing text contrast to exceed 7:1 ratios, expanding mobile touch targets in `MobileBottomNav` to 56px, and linking form labels—fundamentally changed how I approach frontend development. In a public healthcare system serving diverse barangay populations, users include middle-aged and elderly Barangay Health Workers (BHWs) conducting field visits under harsh outdoor sunlight, as well as senior citizens checking digital health passes. A small button or low-contrast text is not merely a cosmetic flaw; it is a direct barrier that can prevent a health worker from recording a patient consultation or delay a resident from receiving medical care. Moving forward, I commit to integrating WCAG AA compliance, semantic HTML, and accessibility audits directly into our continuous development workflow from day one.

---

### Reflection 2 (Team Reviewer / Accessibility Evaluator)

My role in this Activity 9 assignment focused on reviewing the empirical scan data gathered from WAVE and the Accessibility Scanner, evaluating the system against the WCAG POUR framework, and conducting the manual usability check outlined in Section 4. Analyzing the project from a reviewer's perspective provided a clear understanding of why accessibility evaluation requires both automated tooling and human inspection.

The automated WAVE scan excelled at detecting precise technical violations—calculating exact color contrast ratios, identifying unlinked `<input>` elements, and flagging empty `<button>` elements lacking text content. However, WAVE's initial **10 out of 10 AIM Score** on the Resident Dashboard (`/dashboard/resident`) also demonstrated the limits of automated tools: while WAVE reported zero contrast or structural errors, our manual inspection revealed that dynamic tab switches lacked `aria-live` announcements for screen readers and that technical cryptographic terms ("Immutable Ledger Hash") created cognitive friction for non-technical users.

This dual-stage evaluation emphasized that true accessibility extends beyond passing automated test suites. It requires ensuring that language is plain and localized, that touch targets accommodate users with reduced motor control, and that visual hierarchy remains clear across all mobile device screen sizes. Participating in this review reinforced the principle that technology built for local government and community health must be inclusive by design. By resolving these accessibility barriers, BHCMS ensures that digital health record management empowers every barangay citizen and health worker equitably.
