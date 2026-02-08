"use client";

import React, { useState, useEffect } from "react";
import SummaryCards from "@/components/SummaryCards";
import AttendanceGrid from "../components/AttendanceGrid";
import { getEmployees } from "@/actions/employees";
import { getMonthlyData } from "@/actions/attendance";
import EmployeeModal from "@/components/EmployeeModal";
import EmployeeSummarySheet from "@/components/EmployeeSummarySheet";
import { Plus, Search, ChevronLeft, ChevronRight, LogOut, RefreshCw, Save } from "lucide-react";
import { logout } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { getClients, getClientMonthlyData } from "@/actions/clients";
import ClientModal from "@/components/ClientModal";
import ClientCard from "@/components/ClientCard";
import ClientDetailView from "@/components/ClientDetailView";
import ChangePinModal from "@/components/ChangePinModal";
import { Download, Building2, Users as UsersIcon, Wallet, Briefcase, Settings } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function DashboardPage({ role, userId }: { role: string; userId?: string | null }) {
    const [activeTab, setActiveTab] = useState<"staff" | "clients">("staff");
    const [employees, setEmployees] = useState<any[]>([]);
    const [attendanceData, setAttendanceData] = useState<any[]>([]);
    const [advancesData, setAdvancesData] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [clientAssignments, setClientAssignments] = useState<any[]>([]);
    const [clientMoney, setClientMoney] = useState<any[]>([]);
    const [clientExpenses, setClientExpenses] = useState<any[]>([]);
    const [monthlyAdvances, setMonthlyAdvances] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [isEmpModalOpen, setIsEmpModalOpen] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isChangePinModalOpen, setIsChangePinModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
    const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [gridHasPending, setGridHasPending] = useState(false);
    const [gridSaveFn, setGridSaveFn] = useState<(() => void) | null>(null);
    const [gridIsSaving, setGridIsSaving] = useState(false);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Clear old data to prevent "ghost" values while loading
            setAttendanceData([]);
            setAdvancesData([]);
            setMonthlyAdvances([]);

            let emps = await getEmployees(currentDate.getFullYear(), currentDate.getMonth());
            const { attendance, advances, monthlyAdvances: mAdvs } = await getMonthlyData(currentDate.getFullYear(), currentDate.getMonth());

            if (role === "admin") {
                const cls = await getClients();
                const { assignments, moneyTaken, expenses } = await getClientMonthlyData(currentDate.getFullYear(), currentDate.getMonth());
                setClients(cls);
                setClientAssignments(assignments);
                setClientMoney(moneyTaken);
                setClientExpenses(expenses);
            }

            if (role === "employee" && userId) {
                const empIdInt = parseInt(userId);
                setEmployees(emps.filter((e: any) => e.id.toString() === userId));
                setAttendanceData(attendance.filter((a: any) => a.employeeId === empIdInt));
                setAdvancesData(advances.filter((a: any) => a.employeeId === empIdInt));
                setMonthlyAdvances(mAdvs.filter((m: any) => m.employeeId === empIdInt));
            } else {
                setEmployees(emps);
                setAttendanceData(attendance);
                setAdvancesData(advances);
                setMonthlyAdvances(mAdvs);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentDate]);

    const getBillingDates = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const dates: Date[] = [];
        const lastDayOfCurrentMonth = new Date(year, month + 1, 0).getDate();
        for (let d = 2; d <= lastDayOfCurrentMonth; d++) dates.push(new Date(year, month, d));
        dates.push(new Date(year, month + 1, 1));
        return dates;
    };

    const getEmpStats = (emp: any) => {
        const days = attendanceData
            .filter(a => a.employeeId === emp.id && a.present)
            .reduce((s, a) => s + (parseFloat(a.multiplier) || 1), 0);

        const empMonthlyAdv = monthlyAdvances.find(m => m.employeeId === emp.id);
        const advances = advancesData
            .filter(a => a.employeeId === emp.id)
            .reduce((s, c) => s + parseFloat(c.amount), 0) + (empMonthlyAdv ? parseFloat(empMonthlyAdv.amount) : 0);

        const earnings = attendanceData
            .filter(a => a.employeeId === emp.id && a.present)
            .reduce((s, a) => s + (parseFloat(emp.dailyWage) * parseFloat(a.multiplier || 1)), 0);

        return {
            days: days % 1 === 0 ? days : days.toFixed(1),
            advances: advances.toLocaleString(),
            payout: (earnings - advances).toLocaleString()
        };
    };

    const downloadPDF = async () => {
        const element = document.getElementById("pdf-export-content");
        if (!element) return;

        setIsDownloading(true);
        try {
            // Create PDF
            const pdf = new jsPDF("p", "mm", "a4");

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Attendance_Report_${monthNames[currentDate.getMonth()]}_${currentDate.getFullYear()}.pdf`);
        } catch (error) {
            console.error("PDF Download failed", error);
        } finally {
            setIsDownloading(false);
        }
    };

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Summary logic
    // Sum of multipliers for days present
    const daysPresent = attendanceData
        .filter(a => a.present)
        .reduce((acc, curr) => acc + (parseFloat(curr.multiplier) || 1), 0);

    const totalAdvances = advancesData.reduce((acc, curr) => acc + parseFloat(curr.amount), 0) +
        monthlyAdvances.reduce((acc, adv) => acc + parseFloat(adv.amount), 0);

    const totalWages = employees.reduce((acc, emp) => {
        const empEarnings = attendanceData
            .filter(a => a.employeeId === emp.id && a.present)
            .reduce((s, a) => s + (parseFloat(emp.dailyWage) * parseFloat(a.multiplier || 1)), 0);
        return acc + empEarnings;
    }, 0);

    const netPayout = totalWages - totalAdvances;

    const handleEmployeeClick = (emp: any) => {
        setSelectedEmployee(emp);
    };

    // Global Project Stats
    const totalClientsCost = clientAssignments.reduce((acc, curr) => acc + parseFloat(curr.employee.dailyWage || 0), 0);
    const totalClientsMoney = clientMoney.reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
    const clientsBalance = totalClientsMoney - totalClientsCost;

    return (
        <main className="max-w-4xl mx-auto min-h-screen bg-slate-50 font-sans pb-10">
            {/* Row 1: Sticky Navbar */}
            <div className="sticky top-0 z-[50] bg-white/90 backdrop-blur-lg border-b border-slate-200/50 px-4 py-3 flex items-center justify-center shadow-lg shadow-blue-500/5">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-blue-600 to-purple-700 w-10 h-10 rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-blue-500/20 transform -rotate-3">
                        <span className="text-white text-sm font-black tracking-tighter">AK</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-xl font-black tracking-tighter text-slate-900 leading-[0.8]">
                            ATTENDANCE
                        </h1>
                        <div className="flex items-center gap-1.5 mt-2">
                            <div className="h-[2px] w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
                            <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.5em]">Systems</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4">
                {/* Row 2: Role + Tools */}
                <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
                    <span className={cn(
                        "text-[14px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider bg-gray-100 text-blue-800"
                    )}>
                        {role}
                    </span>
                    <div className="flex items-center gap-3">
                        {role === "admin" && (
                            <button
                                onClick={() => setIsChangePinModalOpen(true)}
                                className="p-2 text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 rounded-xl"
                                title="Change Admin PIN"
                            >
                                <Settings size={18} />
                            </button>
                        )}
                        <button
                            onClick={fetchData}
                            disabled={isLoading}
                            className="p-2 text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 rounded-xl disabled:opacity-50"
                            title="Refresh Data"
                        >
                            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                        </button>
                        <button
                            onClick={downloadPDF}
                            className="p-2 text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 rounded-xl"
                            title="Download PDF"
                        >
                            <Download size={18} />
                        </button>
                        <button
                            onClick={() => logout()}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors bg-slate-50 rounded-xl"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                {/* Row 3: Tabs */}
                {role === "admin" && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab("staff")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all",
                                activeTab === "staff" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200" : "bg-white text-slate-500 border border-slate-100"
                            )}
                        >
                            <UsersIcon size={18} /> Staff
                        </button>
                        <button
                            onClick={() => setActiveTab("clients")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all",
                                activeTab === "clients" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-200" : "bg-white text-slate-500 border border-slate-100"
                            )}
                        >
                            <Building2 size={18} /> Projects
                        </button>
                    </div>
                )}

                {/* Row 4: Month Navigation (Restricted) */}
                <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                    <button
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-black text-slate-700 uppercase tracking-tighter text-sm">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                        disabled={(() => {
                            const today = new Date();
                            const diffMonths = (currentDate.getFullYear() - today.getFullYear()) * 12 + (currentDate.getMonth() - today.getMonth());
                            return diffMonths >= 1;
                        })()}
                        onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-20 disabled:hover:bg-transparent rounded-xl transition-all"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {activeTab === "staff" ? (
                    <>
                        {/* Rows 5 & 6: Summary Cards */}
                        <SummaryCards
                            role={role}
                            totalStaff={employees.length}
                            daysPresent={daysPresent % 1 === 0 ? daysPresent : daysPresent.toFixed(1)}
                            totalAdvances={totalAdvances}
                            totalWages={totalWages}
                            netPayout={netPayout}
                        />

                        {/* Row 7: Search + Add Staff */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search staff..."
                                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            {role === "admin" && (
                                <button
                                    onClick={() => setIsEmpModalOpen(true)}
                                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-3 rounded-2xl shadow-lg hover:opacity-90 transition-all active:scale-95"
                                >
                                    <Plus size={24} />
                                </button>
                            )}
                        </div>

                        {/* Save Updates button under search bar (positioned here so it's visually below the search) */}
                        {role === "admin" && gridHasPending && (
                            <div className="mt-3 flex">
                                <button
                                    onClick={async () => {
                                        console.debug("Dashboard Save clicked", { gridHasPending, hasFn: !!gridSaveFn });
                                        try {
                                            if (gridSaveFn) await gridSaveFn();
                                        } catch (e) {
                                            console.error("Error invoking grid save:", e);
                                        }
                                    }}
                                    disabled={gridIsSaving}
                                    className="flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-sm bg-gradient-to-r from-indigo-500 via-blue-600 to-purple-600 text-white shadow-lg hover:opacity-90 active:scale-95"
                                >
                                    {gridIsSaving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                                    {gridIsSaving ? "Saving..." : "Save Updates"}
                                </button>
                            </div>
                        )}

                        {/* Row 8: Table */}
                        <div id="attendance-grid-container" className="pt-2">
                            <AttendanceGrid
                                role={role}
                                employees={filteredEmployees}
                                attendance={attendanceData}
                                advances={advancesData}
                                monthlyAdvances={monthlyAdvances}
                                currentDate={currentDate}
                                onUpdate={fetchData}
                                onPendingChangesChange={(has, saveFn, isSaving) => {
                                    setGridHasPending(has);
                                    setGridSaveFn(() => saveFn);
                                    setGridIsSaving(isSaving);
                                }}
                                onEmployeeClick={handleEmployeeClick}
                                loading={isLoading}
                            />
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        {selectedClientId ? (
                            <ClientDetailView
                                role={role}
                                client={clients.find(c => c.id === selectedClientId)}
                                employees={employees}
                                assignments={clientAssignments}
                                moneyTaken={clientMoney}
                                expenses={clientExpenses}
                                onBack={() => setSelectedClientId(null)}
                                onUpdate={fetchData}
                            />
                        ) : (
                            <>
                                {/* Global Sites Summary */}
                                <div className="grid grid-cols-2 gap-3 mb-2">
                                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Briefcase size={14} className="text-rose-500" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Site Cost</span>
                                        </div>
                                        <div className="text-lg font-black text-slate-900 leading-none">₹{totalClientsCost.toLocaleString()}</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Wallet size={14} className="text-emerald-500" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Global Received</span>
                                        </div>
                                        <div className="text-lg font-black text-slate-900 leading-none">₹{totalClientsMoney.toLocaleString()}</div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center mb-1">
                                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Active Projects</h2>
                                    <button
                                        onClick={() => setIsClientModalOpen(true)}
                                        className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                                    >
                                        <Plus size={16} /> Add Project
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
                                            <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4" />
                                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Loading projects...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {clients.map(client => {
                                                const clientAssignmentsList = clientAssignments.filter(a => a.clientId === client.id);
                                                const clientMoneyList = clientMoney.filter(m => m.clientId === client.id);
                                                const clientExpensesList = clientExpenses.filter(e => e.clientId === client.id);

                                                const expensesTotal = clientExpensesList.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
                                                const cost = clientAssignmentsList.reduce((acc, curr) => acc + parseFloat(curr.employee.dailyWage), 0) + expensesTotal;
                                                const money = clientMoneyList.reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

                                                return (
                                                    <ClientCard
                                                        key={client.id}
                                                        client={client}
                                                        totalCost={cost}
                                                        moneyTaken={money}
                                                        onClick={() => setSelectedClientId(client.id)}
                                                    />
                                                );
                                            })}
                                            {clients.length === 0 && (
                                                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                                                    <Building2 className="mx-auto text-slate-300 mb-2" size={48} />
                                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No project sites added yet.</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* Hidden PDF content */}
            <div id="pdf-export-content" style={{ position: 'absolute', left: '-9999px', top: '0', width: '210mm', backgroundColor: 'white', padding: '20mm', color: 'black' }}>
                <div style={{ marginBottom: '10mm', borderBottom: '2px solid #3b82f6', paddingBottom: '5mm' }}>
                    <h1 style={{ fontSize: '24pt', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>AK Attendance Report</h1>
                    <p style={{ fontSize: '12pt', color: '#64748b', margin: '2mm 0 0 0' }}>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4mm', marginBottom: '10mm' }}>
                    <div style={{ padding: '4mm', backgroundColor: '#f8fafc', borderRadius: '4mm', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#64748b', marginBottom: '2mm', textTransform: 'uppercase' }}>Attendance</p>
                        <p style={{ fontSize: '14pt', fontWeight: '900', color: '#1e293b', margin: 0 }}>{daysPresent % 1 === 0 ? daysPresent : daysPresent.toFixed(1)} <span style={{ fontSize: '8pt', color: '#94a3b8' }}>days</span></p>
                    </div>
                    <div style={{ padding: '4mm', backgroundColor: '#f8fafc', borderRadius: '4mm', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#64748b', marginBottom: '2mm', textTransform: 'uppercase' }}>{role === "employee" ? "Salary" : "Total Wages"}</p>
                        <p style={{ fontSize: '14pt', fontWeight: '900', color: '#1e293b', margin: 0 }}>₹{totalWages.toLocaleString()}</p>
                    </div>
                    <div style={{ padding: '4mm', backgroundColor: '#f8fafc', borderRadius: '4mm', border: '1px solid #e2e8f0' }}>
                        <p style={{ fontSize: '8pt', fontWeight: 'bold', color: '#64748b', marginBottom: '2mm', textTransform: 'uppercase' }}>Advances</p>
                        <p style={{ fontSize: '14pt', fontWeight: '900', color: '#1e293b', margin: 0 }}>₹{totalAdvances.toLocaleString()}</p>
                    </div>
                    <div style={{ padding: '4mm', backgroundColor: '#3b82f6', borderRadius: '4mm', border: '1px solid #2563eb' }}>
                        <p style={{ fontSize: '8pt', fontWeight: 'bold', color: 'white', opacity: 0.8, marginBottom: '2mm', textTransform: 'uppercase' }}>Net Payout</p>
                        <p style={{ fontSize: '14pt', fontWeight: '900', color: 'white', margin: 0 }}>₹{netPayout.toLocaleString()}</p>
                    </div>
                </div>

                {role === "admin" ? (
                    <div>
                        <h2 style={{ fontSize: '16pt', fontWeight: 'bold', color: '#1e293b', marginBottom: '5mm' }}>Staff Details</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11pt' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                                    <th style={{ textAlign: 'left', padding: '3mm' }}>Employee Name</th>
                                    <th style={{ textAlign: 'right', padding: '3mm' }}>Days</th>
                                    <th style={{ textAlign: 'right', padding: '3mm' }}>Advances</th>
                                    <th style={{ textAlign: 'right', padding: '3mm' }}>Payout</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.map(emp => {
                                    const stats = getEmpStats(emp);
                                    return (
                                        <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '3mm', fontWeight: 'bold', color: '#1e293b' }}>{emp.name}</td>
                                            <td style={{ padding: '3mm', textAlign: 'right', color: '#475569' }}>{stats.days}</td>
                                            <td style={{ padding: '3mm', textAlign: 'right', color: '#475569' }}>₹{stats.advances}</td>
                                            <td style={{ padding: '3mm', textAlign: 'right', fontWeight: 'bold', color: '#3b82f6' }}>₹{stats.payout}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ marginTop: '10mm', padding: '5mm', backgroundColor: '#eff6ff', borderRadius: '4mm', border: '1px solid #bfdbfe' }}>
                        <p style={{ color: '#1e40af', fontSize: '10pt', margin: 0 }}>* This report is a summary of your personal attendance and financial records for {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}.</p>
                    </div>
                )}
            </div>

            <EmployeeModal
                isOpen={isEmpModalOpen}
                onClose={() => setIsEmpModalOpen(false)}
                onSuccess={fetchData}
            />

            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSuccess={fetchData}
            />

            <ChangePinModal
                isOpen={isChangePinModalOpen}
                onClose={() => setIsChangePinModalOpen(false)}
            />

            <EmployeeSummarySheet
                role={role}
                employee={selectedEmployee}
                attendanceData={selectedEmployee ? attendanceData.filter(a => a.employeeId === selectedEmployee.id) : []}
                totalAdvances={selectedEmployee ?
                    (advancesData.filter(a => a.employeeId === selectedEmployee.id).reduce((s, c) => s + parseFloat(c.amount), 0) +
                        parseFloat(monthlyAdvances.find(m => m.employeeId === selectedEmployee.id)?.amount || 0)) : 0}
                onClose={() => setSelectedEmployee(null)}
                onUpdate={fetchData}
            />

            {isDownloading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                    <div className="bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                        <div className="flex flex-col items-center text-center">
                            <p className="font-black text-slate-900 text-lg">Generating PDF</p>
                            <p className="text-slate-500 text-sm font-medium">Please wait a moment...</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
