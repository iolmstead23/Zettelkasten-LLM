import dynamic from "next/dynamic";

// Dynamic import with no SSR
const Dashboard = dynamic(() => import("@/components/ui/Dashboard"), {
  ssr: false,
});

/** This is the main component for the dashboard */
export default function Home() {
  return (
    <div>
      <Dashboard />
    </div>
  );
}
