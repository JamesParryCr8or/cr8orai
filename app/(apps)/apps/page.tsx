import { apps } from "@/lib/ai/apps";
import { CardApp } from "@/components/(apps)/dashboard/card-app";
import { HeaderApps } from "@/components/(apps)/dashboard/header-apps";
import { FaqSection } from "@/components/(apps)/dashboard/faq-section";
import { DashboardLayout } from "@/components/(apps)/dashboard/layout";

export const metadata = {
  title: "Next.js Templates & AI Boilerplate Code | AI Wrapper Templates",
  description:
    "Production-ready Next.js templates and AI boilerplate code. Start your AI project with pre-built AI templates, authentication, payments, and more.",
  keywords:
    "nextjs template, nextjs templates, boilerplate code, ai wrapper, nextjs boilerplate",
};

export default async function Page() {
  return (
    <DashboardLayout showGreeting={false}>
      <main className="mx-auto w-full px-6 lg:px-12 xl:px-16 max-w-screen-xl mb-auto relative bg-white">
        {/* Decorative background blur */}
        <div className="w-[600px] h-40 select-none pointer-events-none blur-[100px] opacity-50 absolute -rotate-12 -top-44 -left-20" />

        <HeaderApps />

        <div className="mt-14 flex flex-col gap-y-8">
          {apps.map((app) => (
            <CardApp key={app.href} {...app} />
          ))}
        </div>

        <FaqSection />
      </main>
    </DashboardLayout>
  );
}
