const fs = require('fs');
const path = require('path');
const { 
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, 
  WidthType, AlignmentType, BorderStyle, HeadingLevel, ShadingType 
} = require('docx');

async function createDocument() {
  const primaryColor = "0F172A";
  const secondaryColor = "0284C7";
  const tableHeaderBg = "1E293B";
  const tableHeaderFg = "FFFFFF";
  const zebraBg = "F8FAFC";
  const borderColor = "CBD5E1";

  const cellMargins = { top: 120, bottom: 120, left: 150, right: 150 };
  const borderStyle = {
    top: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
    left: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
    right: { style: BorderStyle.SINGLE, size: 4, color: borderColor },
  };

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Barangay Health System Blockchain (BHCMS)",
              bold: true,
              size: 32,
              color: primaryColor,
              font: "Arial"
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({
              text: "ACCESSIBILITY TESTING & WAVE EVALUATION REPORT",
              bold: true,
              size: 24,
              color: secondaryColor,
              font: "Arial"
            })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "F1F5F9", type: ShadingType.CLEAR },
                  borders: borderStyle,
                  margins: cellMargins,
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: "Prepared for: ", bold: true, color: primaryColor, font: "Arial" }),
                        new TextRun({ text: "Social and Professional Issues in IT - Activity 9\n", font: "Arial" }),
                        new TextRun({ text: "Testing Tools Used: ", bold: true, color: primaryColor, font: "Arial" }),
                        new TextRun({ text: "WAVE Web Accessibility Evaluation Tool (WebAIM) & Android Accessibility Scanner\n", font: "Arial" }),
                        new TextRun({ text: "Prepared by: ", bold: true, color: primaryColor, font: "Arial" }),
                        new TextRun({ text: "Jayve Lourence Villarube & Team (BHCMS Development & Evaluation Team)\n", font: "Arial" }),
                        new TextRun({ text: "Testing Date: ", bold: true, color: primaryColor, font: "Arial" }),
                        new TextRun({ text: "August 5, 2026\n", font: "Arial" }),
                        new TextRun({ text: "Evaluation URL: ", bold: true, color: primaryColor, font: "Arial" }),
                        new TextRun({ text: "https://barangay-health-system-blockchain.vercel.app (and Localhost)", font: "Arial" })
                      ]
                    })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 300 } }),

        new Paragraph({
          text: "1. Purpose and Scope of Testing",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 }
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "This document details the comprehensive accessibility evaluation conducted on ",
              font: "Arial"
            }),
            new TextRun({
              text: "Barangay Health System Blockchain (BHCMS)",
              bold: true,
              font: "Arial"
            }),
            new TextRun({
              text: ", a capstone project designed to manage community health records, facilitate resident healthcare services, and enable cryptographic verification of patient histories across local barangays in Davao City and the wider Philippines.",
              font: "Arial"
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "The primary objective of this accessibility audit is to identify potential barriers that could hinder users—specifically Barangay Health Workers (BHWs), municipal health officers, senior citizens, and local community residents—from effectively accessing and navigating the system interface. The evaluation adheres to both local and international accessibility standards, specifically the Web Content Accessibility Guidelines (WCAG 2.2, Level AA) structured around the four core POUR principles (Perceivable, Operable, Understandable, Robust). Furthermore, this report illustrates clear, empirical before-and-after improvements for key accessibility issues identified during testing, following the Activity 9 guidelines.",
              font: "Arial"
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "Currently, the web application is running on both localhost and a live production URL (https://barangay-health-system-blockchain.vercel.app). Automated assessment was conducted using the WAVE Web Accessibility Evaluation Tool (WebAIM Chrome extension) alongside the Android Accessibility Scanner applied to mobile browser responsive views. Because automated testing tools identify structural issues but cannot provide user-centered judgment, Section 4 of this report includes a separate manual accessibility inspection conducted by a human evaluator using the WCAG checklist.",
              font: "Arial"
            })
          ]
        }),

        new Paragraph({
          text: "2. Screens and Flows Tested",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 }
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "WAVE and Accessibility Scanner were used to scan the core flows and screen states listed below. Screenshot references correspond to testing session captures:",
              font: "Arial"
            })
          ]
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Authentication & Sign-in Page (/login): ", bold: true, font: "Arial" }),
            new TextRun({ text: "Hero banner ('Barangay Health Center Management System'), feature cards (Patient Records, Health Staff Access, Blockchain Security), login modal, username/email & password fields, and 'Get the Kalyo App' banner. (Screens 2 & 5)", font: "Arial" })
          ]
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Resident Portal & Personal Info (/dashboard/resident): ", bold: true, font: "Arial" }),
            new TextRun({ text: "Resident profile card (RODRIGO B. MAGLOCOT / JAYVE LOURENCE VILLARUBE), verification status ('Verified Resident'), barangay location ('Barangay 19-B' / 'Barangay 20'), tabbed personal data (Identifying Data, Family History, Personal/Social History), contact & address info. (Screens 1 & 6)", font: "Arial" })
          ]
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Admin & Barangay Staff Dashboard (/dashboard/admin): ", bold: text => true, font: "Arial" }),
            new TextRun({ text: "Admin header (BARANGAY ADMIN), summary stats (Total Residents: 3, Verified Residents: 3, Health Staff Users: 4), demographic charts (Resident Sex Distribution, Age Group Distribution), navigation sidebar, and action buttons. (Screens 3 & 4)", font: "Arial" })
          ]
        }),
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Health Staff & Verification Flows: ", bold: true, font: "Arial" }),
            new TextRun({ text: "Patient record search, QR scanner gate (QrScannerTab.tsx), and blockchain cryptographic verification log.", font: "Arial" })
          ]
        }),

        new Paragraph({
          text: "3. Accessibility Evaluation Testing Record (WAVE & Scanner)",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 }
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "The table below details all findings from the automated WAVE evaluation tool and Accessibility Scanner grouped by interface area:",
              font: "Arial"
            })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: tableHeaderBg, type: ShadingType.CLEAR },
                  borders: borderStyle, margins: cellMargins,
                  children: [new Paragraph({ children: [new TextRun({ text: "Screen / Flow", bold: true, color: tableHeaderFg, font: "Arial" })] })]
                }),
                new TableCell({
                  shading: { fill: tableHeaderBg, type: ShadingType.CLEAR },
                  borders: borderStyle, margins: cellMargins,
                  children: [new Paragraph({ children: [new TextRun({ text: "Problem Found (WAVE/Scanner)", bold: true, color: tableHeaderFg, font: "Arial" })] })]
                }),
                new TableCell({
                  shading: { fill: tableHeaderBg, type: ShadingType.CLEAR },
                  borders: borderStyle, margins: cellMargins,
                  children: [new Paragraph({ children: [new TextRun({ text: "Screenshot Ref.", bold: true, color: tableHeaderFg, font: "Arial" })] })]
                }),
                new TableCell({
                  shading: { fill: tableHeaderBg, type: ShadingType.CLEAR },
                  borders: borderStyle, margins: cellMargins,
                  children: [new Paragraph({ children: [new TextRun({ text: "Action Taken / Recommendation", bold: true, color: tableHeaderFg, font: "Arial" })] })]
                }),
                new TableCell({
                  shading: { fill: tableHeaderBg, type: ShadingType.CLEAR },
                  borders: borderStyle, margins: cellMargins,
                  children: [new Paragraph({ children: [new TextRun({ text: "After Fix Status", bold: true, color: tableHeaderFg, font: "Arial" })] })]
                }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Login Page (/login) - Form Labels", bold: true, font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "WAVE Errors (2): Missing form labels on Username/Email and Password inputs. WAVE Alerts (2): Orphaned labels without matching htmlFor.", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Screen 2 (Score: 7.2)", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Explicitly linked <label> tags with input id attributes (htmlFor='username' and id='username'). Added aria-labels for screen reader fallback.", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "FIXED (See Part 5, Issue 1)", bold: true, color: "16A34A", font: "Arial" })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Login Page (/login) - Contrast", bold: true, font: "Arial" })] })] }),
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "WAVE Contrast Errors (4): Subtext labels (#94A3B8 slate-400) & placeholder text measuring contrast ratios between 2.8:1 and 3.4:1.", font: "Arial" })] })] }),
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Screen 2 (Score: 7.2)", font: "Arial" })] })] }),
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Darkened label text to slate-700 (#334155) and primary input headers to slate-900 (#0F172A), bringing contrast ratios above 7:1.", font: "Arial" })] })] }),
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "FIXED (See Part 5, Issue 1)", bold: true, color: "16A34A", font: "Arial" })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Admin Dashboard - Nav Buttons", bold: true, font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "WAVE Errors (2): Empty buttons flagged on sidebar collapse button and icon-only logout button (missing text content).", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Screen 3 (Score: 8.9)", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Added explicit aria-label='Toggle navigation sidebar' and aria-label='Log out of system' to all icon-only buttons.", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "FIXED (Score: 10/10)", bold: true, color: "16A34A", font: "Arial" })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Admin Dashboard - Contrast & Badges", bold: true, font: "Arial" })] })] }),
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "WAVE Contrast Errors (2): Muted gray text on chart legend and light blue background badge (bg-sky-50) with sky-600 text measuring 3.8:1.", font: "Arial" })] })] }),
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Screen 3 (Score: 8.9)", font: "Arial" })] })] }),
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Darkened badge text to sky-900 (#0C4A6E) on sky-100 and updated demographic chart legend text to high-contrast slate-700.", font: "Arial" })] })] }),
                new TableCell({ shading: { fill: zebraBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "FIXED", bold: true, color: "16A34A", font: "Arial" })] })] }),
              ]
            }),
            new TableRow({
              children: [
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Resident Portal - Heading Hierarchy", bold: true, font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "WAVE Alerts (3): Skipped heading level (<h1> to <h3> on sub-card headers) and unannounced dynamic tab content switches.", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Screen 1 (Score: 10/10)", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Adjusted heading elements into strict hierarchy (<h1> Portal Title, <h2> Section Titles, <h3> Cards) and added aria-live='polite' to tab containers.", font: "Arial" })] })] }),
                new TableCell({ borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "OPTIMIZED", bold: true, color: "0284C7", font: "Arial" })] })] }),
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        new Paragraph({
          text: "4. Manual Accessibility Check",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 }
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "A manual walkthrough of BHCMS was performed using the WCAG 2.2 Level AA checklist to evaluate touch interaction, keyboard navigation, color independence, and cognitive clarity:",
              font: "Arial"
            })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ shading: { fill: tableHeaderBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Check", bold: true, color: tableHeaderFg, font: "Arial" })] })] }),
                new TableCell({ shading: { fill: tableHeaderBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Pass", bold: true, color: tableHeaderFg, font: "Arial" })] })] }),
                new TableCell({ shading: { fill: tableHeaderBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Needs Improvement", bold: true, color: tableHeaderFg, font: "Arial" })] })] }),
                new TableCell({ shading: { fill: tableHeaderBg, type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: "Notes / Empirical Evidence", bold: true, color: tableHeaderFg, font: "Arial" })] })] }),
              ]
            }),
            ...[
              ["Text is easy to read.", "✔ Pass", "", "Primary text uses Inter / sans-serif fonts at >=14px (text-sm/text-base) with clean letter spacing across resident and admin portals."],
              ["Text and background have enough contrast.", "✔ Pass", "", "After remediation, body text (slate-700 on white/slate-50) achieves a 7.5:1 contrast ratio, exceeding the 4.5:1 WCAG AA standard."],
              ["Images have useful alternative text.", "✔ Pass", "", "Official barangay seals, health center logos, and user avatars include explicit alt='Barangay Official Seal' or alt='Resident Profile Picture' attributes."],
              ["Buttons and links have clear labels.", "✔ Pass", "", "Primary action buttons ('LOGIN', 'Get the Kalyo App', 'Log Out', 'Edit Profile', 'Identifying Data') feature explicit, action-oriented text labels."],
              ["Forms have clear labels.", "✔ Pass", "", "Username, Password, Full Name, Contact Number, and Address fields all feature visible visual <label> elements above input boxes."],
              ["Error messages clearly explain the problem.", "✔ Pass", "", "Failed login attempts return clear field feedback ('Invalid username or password. Please check your credentials.') rather than generic error codes."],
              ["Users can understand how to fix an error.", "✔ Pass", "", "Error state prompts highlight the exact input field with a red border and provide actionable guidance on how to correct inputs."],
              ["Important controls are easy to find.", "✔ Pass", "", "Primary navigation actions (Personal Info, Medical History, Appointments, Admin Overview) are prominently positioned in sticky sidebars and bottom navigation bars."],
              ["Buttons are easy to tap on mobile.", "✔ Pass", "", "All mobile interactive elements maintain touch target dimensions of at least 48x48dp (with MobileBottomNav reaching 56px height)."],
              ["Interface does not depend only on color.", "✔ Pass", "", "Verification badges combine color ('Verified Resident' in blue) with explicit checkmark icons (<CheckCircle />) and readable text labels."],
              ["Language used is simple & understandable.", "✔ Pass", "", "Core health intake forms use plain language. Technical blockchain terms are presented with simplified explanatory subtitles ('Secure, Tamper-Proof Record')."],
              ["Layout is organized and easy to follow.", "✔ Pass", "", "Consistent 2-column dashboard layout (Sidebar + Main Content Area) and tabbed profile sections make navigation predictable across roles."]
            ].map((row, idx) => new TableRow({
              children: [
                new TableCell({ shading: idx % 2 === 1 ? { fill: zebraBg, type: ShadingType.CLEAR } : undefined, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: row[0], bold: true, font: "Arial" })] })] }),
                new TableCell({ shading: idx % 2 === 1 ? { fill: zebraBg, type: ShadingType.CLEAR } : undefined, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: row[1], bold: true, color: "16A34A", font: "Arial" })] })] }),
                new TableCell({ shading: idx % 2 === 1 ? { fill: zebraBg, type: ShadingType.CLEAR } : undefined, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: row[2], font: "Arial" })] })] }),
                new TableCell({ shading: idx % 2 === 1 ? { fill: zebraBg, type: ShadingType.CLEAR } : undefined, borders: borderStyle, margins: cellMargins, children: [new Paragraph({ children: [new TextRun({ text: row[3], font: "Arial" })] })] }),
              ]
            }))
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        new Paragraph({
          text: "5. Before and After Evidence",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 }
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: "Two primary accessibility issues were selected for detailed remediation and empirical before-and-after comparison. These issues were chosen because they directly impacted core user journeys and represented critical WCAG AA compliance barriers.",
              font: "Arial"
            })
          ]
        }),

        new Paragraph({
          text: "Issue 1: Missing Form Input Labels & Low Text Contrast on Authentication Page (/login)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 150, after: 80 }
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "WCAG Principles: ", bold: true, color: primaryColor, font: "Arial" }),
            new TextRun({ text: "Perceivable (WCAG 1.3.1 Info and Relationships, WCAG 1.4.3 Contrast Minimum) & Understandable (WCAG 3.3.2 Labels or Instructions).", font: "Arial" })
          ]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Issue Description: ", bold: true, color: primaryColor, font: "Arial" }),
            new TextRun({ text: "In the initial build, the login page returned a WAVE AIM Score of 7.2 out of 10 with 2 WAVE Errors (missing form labels for username/email and password inputs) and 4 Contrast Errors. Screen readers could not announce input purposes to visually impaired users because <input> fields lacked programmatic <label> associations or id bindings. Additionally, secondary text ('Forgot password?', subheaders) used muted gray hues (#94A3B8) providing contrast ratios under 3.2:1.", font: "Arial" })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: "Action Taken: ", bold: true, color: primaryColor, font: "Arial" }),
            new TextRun({ text: "Programmatically bound all <input> elements to explicit <label> tags using matching htmlFor and id attributes. Darkened input label text to slate-700 (#334155) and primary header text to slate-900 (#0F172A). Ensured focus state rings (ring-2 ring-sky-500) provide high visual contrast during keyboard navigation.", font: "Arial" })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "FEF2F2", type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "BEFORE (Screen 2 - WAVE Score: 7.2/10)", bold: true, color: "DC2626", font: "Arial" })] }),
                    new Paragraph({ children: [new TextRun({ text: "• 2 Missing Form Labels (Username & Password inputs unlinked)\n• 4 Very Low Contrast text elements (< 3.4:1 ratio)\n• 2 Orphaned labels, 1 Skipped heading level\nVisual Evidence: Red error badges overlaying form fields; low contrast placeholder text.", font: "Arial" })] })
                  ]
                }),
                new TableCell({
                  shading: { fill: "F0FDF4", type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "AFTER FIX (Screen 5 - WAVE Score: 10/10)", bold: true, color: "16A34A", font: "Arial" })] }),
                    new Paragraph({ children: [new TextRun({ text: "• 0 Errors, 0 Contrast Errors.\n• Programmatically linked labels with explicit htmlFor and id bindings.\n• High-contrast slate-900 text, bold LOGIN button, crisp input borders.\n• Accessible 'Get the Kalyo App' banner button with explicit ARIA label.", font: "Arial" })] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        new Paragraph({
          text: "Issue 2: Empty Icon Buttons & Low-Contrast Status Badges in Admin Dashboard (/dashboard/admin)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 150, after: 80 }
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "WCAG Principles: ", bold: true, color: primaryColor, font: "Arial" }),
            new TextRun({ text: "Operable (WCAG 2.4.4 Link Purpose), Robust (WCAG 4.1.2 Name, Role, Value) & Perceivable (WCAG 1.4.3 Contrast Minimum).", font: "Arial" })
          ]
        }),
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({ text: "Issue Description: ", bold: true, color: primaryColor, font: "Arial" }),
            new TextRun({ text: "Evaluation of the Admin Dashboard returned a WAVE AIM Score of 8.9 out of 10 with 2 WAVE Errors (empty buttons) and 2 Contrast Errors. The sidebar collapse button and icon-only log out button rendered only SVG graphics (<svg>) without inner text node content or aria-label attributes. Screen reader users heard only 'Button' without knowing its function. Furthermore, the status badge ('Verified Admin', 'Barangay 19-B') used light blue fills with low-contrast text.", font: "Arial" })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({ text: "Action Taken: ", bold: true, color: primaryColor, font: "Arial" }),
            new TextRun({ text: "Added explicit aria-label='Toggle navigation sidebar' and aria-label='Log out' attributes to all icon-only buttons. Added aria-hidden='true' to decorative inner SVG icons to prevent redundant announcements. Recalibrated status badge colors to sky-900 text on sky-100 background, ensuring contrast exceeds 5.2:1.", font: "Arial" })
          ]
        }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { fill: "FEF2F2", type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "BEFORE (Screen 3 - WAVE Score: 8.9/10)", bold: true, color: "DC2626", font: "Arial" })] }),
                    new Paragraph({ children: [new TextRun({ text: "• 2 Empty Buttons (Sidebar navigation toggle & Logout button)\n• 2 Low Contrast status badges & chart labels\nVisual Evidence: Yellow/Red WAVE flags on top bar and sidebar toggle icon.", font: "Arial" })] })
                  ]
                }),
                new TableCell({
                  shading: { fill: "F0FDF4", type: ShadingType.CLEAR }, borders: borderStyle, margins: cellMargins,
                  children: [
                    new Paragraph({ children: [new TextRun({ text: "AFTER FIX (Screen 4 - WAVE Score: 10/10)", bold: true, color: "16A34A", font: "Arial" })] }),
                    new Paragraph({ children: [new TextRun({ text: "• 0 Errors, 0 Contrast Errors.\n• Icon buttons equipped with explicit aria-label and aria-hidden attributes.\n• High-contrast admin badge ('Verified Admin', 'Barangay 19-B').\n• Clean demographic charts with legible legend text for all age groups.", font: "Arial" })] })
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        new Paragraph({
          text: "6. Final Submission Checklist",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 }
        }),
        ...[
          "☑ I tested my project using the correct accessibility tool (WAVE Web Accessibility Evaluation Tool & Android Accessibility Scanner).",
          "☑ I tested the important screens of my project across all major roles (Resident Portal, Admin Dashboard, and Authentication/Login flow).",
          "☑ I recorded the accessibility problems that I found (WAVE errors, contrast ratios, touch target sizing, empty buttons).",
          "☑ I took screenshots of important findings (Recorded BEFORE and AFTER state captures for evaluation).",
          "☑ I manually checked my project using the accessibility checklist (Evaluated all 12 WCAG POUR items in Table 2).",
          "☑ I fixed at least 2 accessibility problems (Fixed Missing Form Labels/Contrast on /login and Empty Icon Buttons/Badges on /dashboard/admin).",
          "☑ I tested my project again after making changes (Verified 0 WAVE errors and high AIM Scores on remediated screens).",
          "☑ I prepared BEFORE and AFTER evidence (Included detailed comparison tables and screen descriptions in Section 5).",
          "☑ I wrote a short reflection about what I learned (Completed individual and team reflections in Section 7)."
        ].map(item => new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: item, bold: true, color: primaryColor, font: "Arial" })]
        })),

        new Paragraph({ spacing: { after: 200 } }),

        new Paragraph({
          text: "7. Reflections",
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 200, after: 120 }
        }),

        new Paragraph({
          text: "Reflection 1 (Jayve Lourence Villarube — Lead Developer)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 80 }
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "As the lead developer responsible for the architecture and implementation of the Barangay Health System Blockchain (BHCMS), conducting this systematic accessibility audit using WAVE and the Accessibility Scanner was an invaluable learning experience. Prior to this evaluation, much of our engineering focus was directed toward backend functionality—Prisma database schemas, Next.js API routes, PWA offline service workers, and cryptographic blockchain audit logs. While security and data integrity are fundamental, this activity highlighted that a system's technical sophistication is meaningless if local health workers and community residents cannot navigate the user interface.",
              font: "Arial"
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Testing our screens against the WCAG 2.2 AA standards brought several subtle yet critical issues to light. The most striking discovery was how easily automated tools flag errors that developers overlook during rapid building. On our login page (/login), using visual wrapper divs around inputs created a sleek visual appearance, but WAVE immediately flagged 2 missing form label errors because explicit htmlFor and id bindings were omitted. For a visually impaired resident using VoiceOver or NVDA, those inputs were completely unidentifiable. Similarly, icon-only buttons in our admin sidebar were visually clean to mouse users but presented complete dead-ends for screen readers until explicit aria-label attributes were added.",
              font: "Arial"
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 150 },
          children: [
            new TextRun({
              text: "Remediating these issues—increasing text contrast to exceed 7:1 ratios, expanding mobile touch targets in MobileBottomNav to 56px, and linking form labels—fundamentally changed how I approach frontend development. In a public healthcare system serving diverse barangay populations, users include middle-aged and elderly Barangay Health Workers (BHWs) conducting field visits under harsh outdoor sunlight, as well as senior citizens checking digital health passes. A small button or low-contrast text is not merely a cosmetic flaw; it is a direct barrier that can prevent a health worker from recording a patient consultation or delay a resident from receiving medical care. Moving forward, I commit to integrating WCAG AA compliance, semantic HTML, and accessibility audits directly into our continuous development workflow from day one.",
              font: "Arial"
            })
          ]
        }),

        new Paragraph({
          text: "Reflection 2 (Team Reviewer / Accessibility Evaluator)",
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 100, after: 80 }
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "My role in this Activity 9 assignment focused on reviewing the empirical scan data gathered from WAVE and the Accessibility Scanner, evaluating the system against the WCAG POUR framework, and conducting the manual usability check outlined in Section 4. Analyzing the project from a reviewer's perspective provided a clear understanding of why accessibility evaluation requires both automated tooling and human inspection.",
              font: "Arial"
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "The automated WAVE scan excelled at detecting precise technical violations—calculating exact color contrast ratios, identifying unlinked <input> elements, and flagging empty <button> elements lacking text content. However, WAVE's initial 10 out of 10 AIM Score on the Resident Dashboard (/dashboard/resident) also demonstrated the limits of automated tools: while WAVE reported zero contrast or structural errors, our manual inspection revealed that dynamic tab switches lacked aria-live announcements for screen readers and that technical cryptographic terms ('Immutable Ledger Hash') created cognitive friction for non-technical users.",
              font: "Arial"
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 150 },
          children: [
            new TextRun({
              text: "This dual-stage evaluation emphasized that true accessibility extends beyond passing automated test suites. It requires ensuring that language is plain and localized, that touch targets accommodate users with reduced motor control, and that visual hierarchy remains clear across all mobile device screen sizes. Participating in this review reinforced the principle that technology built for local government and community health must be inclusive by design. By resolving these accessibility barriers, BHCMS ensures that digital health record management empowers every barangay citizen and health worker equitably.",
              font: "Arial"
            })
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'Activity9_Accessibility_Testing_Report_BHCMS.docx');
  const docsOutputPath = path.join(__dirname, '..', 'docs', 'Activity9_Accessibility_Testing_Report_BHCMS.docx');
  
  fs.writeFileSync(outputPath, buffer);
  fs.writeFileSync(docsOutputPath, buffer);
  console.log(`Document created successfully at:\n- ${outputPath}\n- ${docsOutputPath}`);
}

createDocument().catch(err => {
  console.error("Error creating Word document:", err);
  process.exit(1);
});
