# AK Attendance Systems 📋

A premium, mobile-first Attendance and Payroll Management System designed for contractors and site managers. Track workforce assignments across multiple project sites, manage daily advances, and generate professional payroll reports with ease.

## ✨ Features

### 🏢 Project & Site Management
- **Multi-Site Tracking**: Manage multiple project sites (Clients) simultaneously.
- **Workforce Assignment**: Assign specific staff to different sites on a daily basis.
- **Financial Overviews**: Track "Total Site Cost" vs. "Money Received" per project.
- **Entry Logs**: Detailed daily logs of assignments and financial transactions.

### 📅 Advanced Attendance
- **Custom Billing Cycle**: Payroll logic runs from the **2nd of the current month to the 1st of the next month**.
- **Multiplier Support**: Support for complex shifts with multipliers: `0.5x`, `1.0x`, `1.5x`, `2.0x`, and `3.0x`.
- **Debounced Storage**: Instant UI feedback with a **2-second debounced save** to prevent server overload during rapid marking.
- **Future Date Guard**: Prevents accidental logging of attendance for future dates.

### 🔑 Secure PIN Access
- **Employee Portal**: Employees can log in using a unique 4-digit PIN.
- **Restricted View**: Employees see only their own attendance, salary, and advances (read-only).
- **Auto-Login**: Seamless experience with automatic login upon entering the 4th digit.

### 📊 Payroll & Reporting
- **Dynamic Summary Cards**: Real-time calculation of Total Wages, Advances, and Net Payout.
- **Color-Coded Payouts**: Visual indicators for debt vs. credit (Green for earnings, Red for payments).
- **PDF Export**: Generate high-fidelity attendance reports with site branding, ready for sharing or printing.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database/ORM**: [TypeORM](https://typeorm.io/) with SQLite
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PDF Generation**: [jspdf](https://rawgit.com/MrRio/jsPDF/master/docs/index.html) & [html2canvas](https://html2canvas.hertzen.com/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm / yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables (`.env`):
   - DATABASE_URL (for TypeORM)
   - SESSION_SECRET (for auth)

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📱 Mobile-First Design
The application is optimized for mobile usage, featuring:
- **Bottom-sheet-style Modals** for easy thumb interactions.
- **Sticky Headers** to maintain navigation context.
- **Condensed Grids** for maximum data visibility on small screens.
- **Input Guardrails** to prevent accidental numeric errors and zoom issues.

---

## 📄 License
This project is private and intended for authorized use specifically for AK Attendance Systems.
