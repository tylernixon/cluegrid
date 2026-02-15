# Cluegrid - Legal & IP Checklist

## 1. Trademark Considerations for "Cluegrid"

### 1.1 Name Risk Assessment

**Overall Risk Level: LOW-MODERATE**

The name "Cluegrid" is a compound of two generic English words ("clue" + "grid"). This is favorable for trademark purposes because:

- It does not contain "Wordle," "Crossword," or any other established game brand name.
- It is descriptive of the game mechanic (clues on a grid), which makes it less likely to conflict with existing marks but also harder to get strong trademark protection.
- It is not confusingly similar in sight, sound, or meaning to "Wordle" (owned by The New York Times).

**Action Items:**

- [ ] Search the USPTO Trademark Electronic Search System (TESS) for "Cluegrid," "Clue Grid," and similar marks in International Class 9 (software), Class 28 (games), and Class 41 (entertainment services).
- [ ] Search the EU Intellectual Property Office (EUIPO) trademark database for the same terms.
- [ ] Search common-law usage: Google, app stores, domain registrations, and social media handles.
- [ ] Secure the domain `cluegrid.app` (referenced in PDD -- confirm registration and ownership).
- [ ] Secure social media handles (@cluegrid) on key platforms (X/Twitter, Instagram, TikTok, Reddit).
- [ ] Consider filing an intent-to-use (ITU) trademark application in Class 9/41 before public launch to establish priority date.
- [ ] If launching in the EU, consider an EUIPO application as well.

### 1.2 Naming Restrictions

- **Never** use "Wordle" in the product name, tagline, metadata, or marketing copy.
- **Avoid** names that begin with "Word-" or end with "-dle" to prevent association claims.
- **Do not** use "NYT," "New York Times," or reference their products in marketing.
- It is acceptable to compare gameplay in editorial/press contexts (e.g., "for fans of daily word games"), but not in app store descriptions or ads in a way that implies endorsement.

---

## 2. Visual Differentiation Requirements

### 2.1 Why This Matters

The New York Times has actively enforced against Wordle clones. While game mechanics cannot be copyrighted, the overall look-and-feel, specific visual design, and trade dress can be protected. Cluegrid must be visually distinct.

### 2.2 Differentiation Checklist

| Element | Wordle | Cluegrid Requirement | Status |
|---------|--------|---------------------|--------|
| Grid layout | 5x6 single-word rows | Cross-shaped grid with crossers -- DIFFERENT by design | OK |
| Color: Correct | #6AAA64 (green) | Use a distinct green (PDD uses #6AAA64 -- CHANGE recommended) | REVIEW |
| Color: Present | #C9B458 (gold/yellow) | Use a distinct gold (PDD uses #C9B458 -- CHANGE recommended) | REVIEW |
| Color: Absent | #787C7E (gray) | Use a distinct gray (PDD uses #787C7E -- CHANGE recommended) | REVIEW |
| Font | NY Times proprietary | Inter -- DIFFERENT | OK |
| Share card emoji | Green/yellow/gray squares | Consider using different emoji or a unique pattern | REVIEW |
| App icon | Green square with W | Must be completely different -- suggest grid/puzzle motif | PENDING |
| Header style | "Wordle" centered, minimal | "CLUEGRID" with distinct branding | PENDING |
| Animation style | Card flip | Card flip is common, but consider adding unique motion identity | OK |
| Keyboard layout | Standard QWERTY with colors | Standard is fine, but use Cluegrid's own color scheme | OK |

### 2.3 Required Visual Changes

**HIGH PRIORITY:**
- [ ] Change the exact hex values for Correct/Present/Absent so they are not identical to Wordle's palette. Even a 10-15% hue shift provides differentiation. Recommended:
  - Correct: shift toward teal-green (e.g., #4A9E7E or similar)
  - Present: shift toward amber/copper (e.g., #D4A843 or similar)
  - Absent: use a warmer or cooler gray distinct from Wordle's
- [ ] Design share card format that is structurally different (the current PDD format with colored squares closely mirrors Wordle's -- the crosser grid structure should be leveraged to make shares look distinct).

**MEDIUM PRIORITY:**
- [ ] Develop a unique app icon that does not resemble Wordle's green square.
- [ ] Design a distinctive completion/celebration screen that differs from Wordle's.

**LOW PRIORITY (but recommended):**
- [ ] Consider a unique visual element (e.g., the cross-grid intersection highlight) that becomes Cluegrid's signature identity.

---

## 3. Privacy Policy Requirements

### 3.1 Overview

A privacy policy is legally required in most jurisdictions for any web application that collects data. Even with minimal data collection, Cluegrid needs one before launch.

### 3.2 Data Collection Inventory

Based on the PDD, Architecture, and Analytics documents, Cluegrid collects:

| Data Category | What | Where Stored | Retention |
|---------------|------|--------------|-----------|
| Game state | Current puzzle progress | localStorage (client) | Session |
| User stats | Streaks, wins, distribution | localStorage (client) | Indefinite (client-side) |
| User settings | Theme, accessibility prefs | localStorage (client) | Indefinite (client-side) |
| Analytics events | Page views, game actions, errors | PostHog (third-party) | 12 months |
| Session recordings | User interactions (masked) | PostHog (third-party) | 30 days |
| Anonymous user ID | PostHog distinct_id | PostHog + localStorage | Until opt-out |
| Error data | JS exceptions, stack traces | Sentry (third-party) | Per Sentry plan |
| Server logs | IP addresses, request metadata | Vercel (hosting) | Per Vercel plan |
| Puzzle stats | Aggregated play/win data | Supabase (server) | Indefinite |

### 3.3 Privacy Policy Must Include

- [ ] **Identity of data controller**: Who operates Cluegrid (individual or entity name, contact info).
- [ ] **What data is collected**: Full list per table above.
- [ ] **Legal basis for processing**: Legitimate interest (analytics), consent (optional cookies/tracking).
- [ ] **How data is used**: Improving the game, monitoring errors, understanding player behavior.
- [ ] **Third-party services**: Disclose PostHog, Sentry, Vercel, and Supabase -- link to their privacy policies.
- [ ] **Data retention periods**: Per the table above.
- [ ] **User rights**: Right to access, delete, and opt out of analytics.
- [ ] **Cookies/localStorage**: Explain use of localStorage for game state and analytics identifiers.
- [ ] **Children's data**: If COPPA applies (US), state whether the service is intended for children under 13. Recommended: state it is not directed at children under 13.
- [ ] **International transfers**: If PostHog/Sentry data is processed outside the EU, disclose this.
- [ ] **Contact information**: An email address for privacy inquiries.
- [ ] **Policy update process**: How users will be notified of changes.

### 3.4 Where to Display

- [ ] Link in the footer of every page.
- [ ] Link in the Settings screen.
- [ ] Link during first-visit onboarding (if collecting analytics from the start).
- [ ] Accessible at a dedicated URL (e.g., `cluegrid.app/privacy`).

---

## 4. Terms of Service Requirements

### 4.1 Overview

Terms of Service (ToS) protect the operator and set expectations for users. Required before public launch.

### 4.2 Terms Must Include

- [ ] **Acceptance of terms**: Using the service constitutes acceptance.
- [ ] **Service description**: What Cluegrid is and what it provides.
- [ ] **User conduct**: Prohibited behaviors (scraping, reverse engineering, automated play, abuse).
- [ ] **Intellectual property**: Cluegrid owns the puzzles, clues, software, and brand. Users do not acquire rights by playing.
- [ ] **User-generated content**: If sharing is tracked or displayed, clarify that share text is generated from game data.
- [ ] **Disclaimer of warranties**: Service provided "as is" -- no guarantee of availability or accuracy.
- [ ] **Limitation of liability**: Cap liability to the extent permitted by law.
- [ ] **Termination**: Right to suspend or terminate access for violations.
- [ ] **Governing law**: Specify jurisdiction (recommend the operator's home jurisdiction).
- [ ] **Dispute resolution**: Consider mandatory arbitration or small claims court carve-out.
- [ ] **Modification of terms**: Right to update terms with notice to users.
- [ ] **Age requirement**: Minimum age to use the service (13+ recommended for COPPA compliance).
- [ ] **Third-party services**: Disclaim responsibility for third-party availability (Vercel, Supabase).

### 4.3 Where to Display

- [ ] Link in the footer of every page.
- [ ] Link in the Settings screen.
- [ ] Accessible at a dedicated URL (e.g., `cluegrid.app/terms`).

---

## 5. GDPR Basics for MVP

### 5.1 Does GDPR Apply?

**Yes, likely.** GDPR applies if:
- You have users in the EU/EEA (Cluegrid is a public web app, so yes), OR
- You monitor the behavior of EU individuals.

Even without accounts, PostHog's anonymous distinct_id and IP-based geolocation constitute personal data processing under GDPR.

### 5.2 GDPR Compliance Checklist

**Lawful Basis:**
- [ ] Document the lawful basis for each data processing activity:
  - Game functionality (localStorage): **Legitimate interest** (necessary for service delivery)
  - Analytics (PostHog): **Consent** (preferred) or **Legitimate interest** (if minimal and anonymized)
  - Error tracking (Sentry): **Legitimate interest**
  - Server logs (Vercel): **Legitimate interest**

**Consent:**
- [ ] Implement a cookie/tracking consent banner for EU users before firing PostHog events.
- [ ] Provide a clear opt-in/opt-out mechanism (the analytics opt-out in the codebase is a good start).
- [ ] Do NOT pre-check consent boxes.
- [ ] Record consent status (timestamp, version of policy consented to).

**Data Subject Rights:**
- [ ] **Right to access**: Provide a way for users to request their data (email-based process is fine for MVP).
- [ ] **Right to erasure**: Implement the `/api/privacy/delete` endpoint noted in ANALYTICS.md. Verify it deletes from PostHog and Sentry.
- [ ] **Right to portability**: Not critical for MVP (no accounts), but be prepared.
- [ ] **Right to object**: Analytics opt-out serves this purpose.

**Data Processing:**
- [ ] List all third-party sub-processors (PostHog, Sentry, Vercel, Supabase) in the privacy policy.
- [ ] Verify each sub-processor has a Data Processing Agreement (DPA) or equivalent GDPR commitment:
  - PostHog: Offers DPA -- sign it.
  - Sentry: Offers DPA -- sign it.
  - Vercel: Has DPA in their terms.
  - Supabase: Has DPA in their terms.
- [ ] If PostHog or Sentry data is stored in the US, ensure adequate transfer mechanisms (Standard Contractual Clauses or equivalent).

**Data Minimization:**
- [ ] Confirm no PII is collected beyond what is necessary.
- [ ] Verify PostHog session recordings mask all inputs (confirmed in ANALYTICS.md).
- [ ] Do NOT store IP addresses longer than necessary (check Vercel log retention).

**Data Breach:**
- [ ] Have a basic incident response plan: who to notify, within what timeframe (72 hours for GDPR supervisory authority notification).

### 5.3 Implementation Priority

| Item | Priority | Effort |
|------|----------|--------|
| Cookie consent banner for EU users | HIGH | Medium |
| Privacy policy page | HIGH | Low |
| Analytics opt-out mechanism | HIGH | Low (already partially built) |
| Data deletion endpoint | MEDIUM | Low (already partially built) |
| DPA with sub-processors | MEDIUM | Low (sign existing agreements) |
| Consent record-keeping | LOW for MVP | Medium |

---

## 6. Content Sensitivity Guidelines

### 6.1 Word Content Risks

The PDD and Content Pipeline already address some of these, but formalizing is important for legal protection.

**Prohibited Words (must never appear as answers or crosser words):**
- [ ] Slurs, hate speech, or derogatory terms of any kind.
- [ ] Sexually explicit words.
- [ ] Words primarily associated with violence or self-harm.

**Sensitive Words (use with caution, editorial review required):**
- [ ] Words with dual meanings where one meaning is offensive.
- [ ] Words related to religion, politics, or cultural practices.
- [ ] Words that are regionally offensive but not universally.

### 6.2 Clue Content Risks

- [ ] Clues must not contain defamatory statements about real people.
- [ ] Clues must not reference copyrighted content in a way that implies endorsement (e.g., do not use movie quotes, song lyrics, or book excerpts without fair-use analysis).
- [ ] Clues must not contain misinformation presented as fact.
- [ ] Avoid clues that rely on stereotypes (gender, racial, cultural, national).

### 6.3 User-Generated Content

- [ ] The current MVP does not support user-generated puzzles or comments -- this is good. If added later (Community puzzle creation is listed as P2), a full moderation and content policy framework will be needed.
- [ ] Share cards are system-generated (emoji grids), so content risk is minimal.

### 6.4 Content Review Process

- [ ] Maintain a blocklist of prohibited words, reviewed quarterly.
- [ ] Require at least 2-person review for all puzzle content before scheduling (already noted in PDD section 7.1).
- [ ] Log who approved each puzzle and when (add `approved_by` and `approved_at` fields if not present).

---

## 7. Additional Legal Considerations

### 7.1 Game Mechanics and IP

- Game mechanics (rules, scoring) are NOT copyrightable under US law (see *Tetris Holding v. Xio Interactive* for the line between mechanics and expression).
- The specific visual expression of those mechanics IS protectable. Hence the visual differentiation requirements in Section 2.
- Cluegrid's hybrid clue-crossword mechanic is sufficiently distinct from Wordle's pure-deduction mechanic.

### 7.2 Open Source Dependencies

- [ ] Audit all npm dependencies for license compatibility before launch.
- [ ] Ensure no GPL-licensed packages are included if the project is proprietary (MIT, Apache 2.0, and BSD are safe).
- [ ] Document licenses in a LICENSES or THIRD_PARTY_NOTICES file.

### 7.3 Accessibility Legal Risk

- [ ] Web Content Accessibility Guidelines (WCAG) 2.1 AA compliance reduces risk of ADA-related claims in the US and equivalent claims in the EU (European Accessibility Act, effective June 2025).
- [ ] The PDD already targets WCAG AA -- ensure this is tested and documented.

### 7.4 Domain and Brand Protection

- [ ] Register `cluegrid.com` in addition to `cluegrid.app` to prevent squatting.
- [ ] Consider registering common misspellings if budget allows.

---

## 8. Pre-Launch Legal Checklist Summary

| Item | Status | Blocking Launch? |
|------|--------|-----------------|
| Trademark search for "Cluegrid" | PENDING | YES |
| Visual differentiation from Wordle | REVIEW NEEDED | YES |
| Privacy policy published | PENDING | YES |
| Terms of service published | PENDING | YES |
| Cookie consent for EU users | PENDING | YES |
| Analytics opt-out mechanism | PARTIALLY BUILT | YES |
| Data deletion endpoint | PARTIALLY BUILT | NO (but recommended) |
| Sub-processor DPAs signed | PENDING | NO (but recommended) |
| Content blocklist in place | PENDING | YES |
| Open source license audit | PENDING | NO |
| Accessibility audit | PENDING | NO (but reduces risk) |
| Domain registration confirmed | PENDING | YES |

---

*Last updated: 2026-02-14*
*Owner: Legal / IP Advisor*
*Review cadence: Before each launch milestone (beta, public launch)*
