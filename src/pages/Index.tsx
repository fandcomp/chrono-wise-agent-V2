import { useState } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { DashboardView } from "@/components/Dashboard/DashboardView";
import { AnalyticsView } from "@/components/Analytics/AnalyticsView";
import { UploadView } from "@/components/Upload/UploadView";
import { QuickAddView } from "@/components/QuickAdd/QuickAddView";
import { GeminiTestView } from "@/components/GeminiTestView";
import { CalendarSyncView } from "@/components/Calendar/CalendarSyncView";

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView onViewChange={setActiveView} />;
      case 'analytics':
        return <AnalyticsView />;
      case 'upload':
        return <UploadView />;
      case 'add-task':
        return <QuickAddView />;
      case 'gemini-test':
        return <GeminiTestView />;
      case 'calendar-sync':
        return <CalendarSyncView />;
      case 'testing':
        return <div className="text-center py-8"><p className="text-muted-foreground">Testing tools coming soon...</p></div>;
      default:
        return <DashboardView onViewChange={setActiveView} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1 p-6 overflow-auto">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
};

export default Index;
