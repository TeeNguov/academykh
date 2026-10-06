"use client";

import { useEffect, useState } from "react";
import { mdiLinkVariant, mdiViewModule } from "@mdi/js";
import { ApiCourseAccess, ApiCourseDetail } from "@/lib/api";
import { Icon } from "@/components/Icon";
import { CourseAccessManager } from "@/components/courses/CourseAccessManager";
import { ModuleEditor } from "@/components/courses/ModuleEditor";

type CourseManagerTab = "modules" | "links";

const tabs: { id: CourseManagerTab; label: string; icon: string }[] = [
  { id: "modules", label: "Modules", icon: mdiViewModule },
  { id: "links", label: "Links", icon: mdiLinkVariant }
];

export function CourseManagerTabs({ course, access }: { course: ApiCourseDetail; access: ApiCourseAccess | null }) {
  const [activeTab, setActiveTab] = useState<CourseManagerTab>("modules");

  useEffect(() => {
    if (window.location.hash === "#course-access" || window.location.hash === "#links") {
      setActiveTab("links");
    }
  }, []);

  function selectTab(tab: CourseManagerTab) {
    setActiveTab(tab);
    window.history.replaceState(null, "", tab === "links" ? "#links" : window.location.pathname);
  }

  return (
    <div className="mt-7">
      <div className="flex flex-wrap gap-2 border-b border-line">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-black transition ${
              activeTab === tab.id ? "border-moss text-moss" : "border-transparent text-ink/58 hover:text-ink"
            }`}
            onClick={() => selectTab(tab.id)}
          >
            <Icon path={tab.icon} size={0.76} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-6">
        {activeTab === "modules" ? (
          <ModuleEditor course={course} />
        ) : (
          <div id="course-access" className="scroll-mt-6">
            <CourseAccessManager course={course} access={access} />
          </div>
        )}
      </div>
    </div>
  );
}
